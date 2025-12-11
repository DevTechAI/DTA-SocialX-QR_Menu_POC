// lib/utils/analytics.ts

const DB_NAME = 'SocialXAnalytics';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const VISITOR_UUID_KEY = 'socialx_visitor_uuid';
const SESSION_ID_KEY = 'socialx_session_id';
const SESSION_START_KEY = 'socialx_session_start';

interface AnalyticsEvent {
  eventType: 'page_view' | 'button_click' | 'item_add' | 'item_remove' | 
             'category_expand' | 'category_collapse' | 'image_click' | 
             'form_submit' | 'view_change';
  eventCategory: 'navigation' | 'interaction' | 'menu' | 'checkout' | 'order';
  pageRoute: string;
  viewState?: string;
  elementId?: string;
  elementName?: string;
  elementType?: string;
  metadata?: Record<string, any>;
  timeOnPageSeconds?: number;
  scrollPosition?: number;
}

interface DeviceInfo {
  type: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  referrer: string;
}

class AnalyticsTracker {
  private db: IDBDatabase | null = null;
  private visitorUuid: string | null = null;
  private sessionId: string | null = null;
  private sessionStartTime: number = Date.now();
  private pageStartTime: number = Date.now();
  private inactivityTimer: NodeJS.Timeout | null = null;
  private INACTIVITY_TIMEOUT = 300000; // 5 minutes
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Get or create visitor UUID
      this.visitorUuid = this.getOrCreateVisitorUuid();
      
      // Get or create session ID
      this.sessionId = this.getOrCreateSessionId();
      
      // Initialize IndexedDB
      await this.initDB();
      
      // Track initial page view
      this.trackPageView();
      
      // Set up inactivity timer
      this.setupInactivityTimer();
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flushEvents(true));
      window.addEventListener('pagehide', () => this.flushEvents(true));
      
      // Track user activity to reset inactivity timer
      ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private getOrCreateVisitorUuid(): string {
    let uuid = localStorage.getItem(VISITOR_UUID_KEY);
    if (!uuid) {
      uuid = this.generateUUID();
      localStorage.setItem(VISITOR_UUID_KEY, uuid);
    }
    return uuid;
  }

  private getOrCreateSessionId(): string {
    // Check if session exists and is recent (within 30 minutes)
    const savedSessionId = sessionStorage.getItem(SESSION_ID_KEY);
    const savedSessionStart = sessionStorage.getItem(SESSION_START_KEY);
    
    if (savedSessionId && savedSessionStart) {
      const sessionAge = Date.now() - parseInt(savedSessionStart);
      // If session is less than 30 minutes old, reuse it
      if (sessionAge < 1800000) {
        return savedSessionId;
      }
    }
    
    // Create new session
    const sessionId = this.generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    this.sessionStartTime = Date.now();
    return sessionId;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('sent', 'sent', { unique: false });
          store.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  private setupInactivityTimer(): void {
    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.inactivityTimer = setTimeout(() => {
      // User inactive for 5 minutes - flush events
      this.flushEvents(false);
    }, this.INACTIVITY_TIMEOUT);
  }

  trackPageView(pageRoute?: string, viewState?: string): void {
    const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000);
    this.pageStartTime = Date.now();
    
    this.trackEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      pageRoute: pageRoute || window.location.pathname,
      viewState,
      timeOnPageSeconds: timeOnPage,
      scrollPosition: window.scrollY,
    });
  }

  trackButtonClick(
    buttonName: string,
    buttonId?: string,
    pageRoute?: string,
    viewState?: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      eventType: 'button_click',
      eventCategory: 'interaction',
      pageRoute: pageRoute || window.location.pathname,
      viewState,
      elementId: buttonId,
      elementName: buttonName,
      elementType: 'button',
      metadata,
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
      scrollPosition: window.scrollY,
    });
  }

  trackItemAdd(itemId: string, itemName: string, quantity: number, price: number): void {
    this.trackEvent({
      eventType: 'item_add',
      eventCategory: 'menu',
      pageRoute: '/order-menu',
      viewState: 'menu',
      elementId: itemId,
      elementName: itemName,
      elementType: 'menu_item',
      metadata: { quantity, price },
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
  }

  trackItemRemove(itemId: string, itemName: string): void {
    this.trackEvent({
      eventType: 'item_remove',
      eventCategory: 'menu',
      pageRoute: '/order-menu',
      viewState: 'menu',
      elementId: itemId,
      elementName: itemName,
      elementType: 'menu_item',
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
  }

  trackCategoryExpand(categoryName: string): void {
    this.trackEvent({
      eventType: 'category_expand',
      eventCategory: 'menu',
      pageRoute: '/order-menu',
      viewState: 'menu',
      elementName: categoryName,
      elementType: 'category',
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
  }

  trackCategoryCollapse(categoryName: string): void {
    this.trackEvent({
      eventType: 'category_collapse',
      eventCategory: 'menu',
      pageRoute: '/order-menu',
      viewState: 'menu',
      elementName: categoryName,
      elementType: 'category',
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
  }

  trackImageClick(itemId: string, itemName: string): void {
    this.trackEvent({
      eventType: 'image_click',
      eventCategory: 'interaction',
      pageRoute: '/order-menu',
      viewState: 'menu',
      elementId: itemId,
      elementName: itemName,
      elementType: 'image',
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
  }

  trackViewChange(fromView: string, toView: string): void {
    this.trackEvent({
      eventType: 'view_change',
      eventCategory: 'navigation',
      pageRoute: '/order-menu',
      viewState: toView,
      elementName: `${fromView} → ${toView}`,
      elementType: 'view_transition',
      metadata: { fromView, toView },
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
    
    // Reset page start time for new view
    this.pageStartTime = Date.now();
  }

  trackFormSubmit(formName: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      eventType: 'form_submit',
      eventCategory: 'checkout',
      pageRoute: '/order-menu',
      viewState: 'nameEntry',
      elementName: formName,
      elementType: 'form',
      metadata,
      timeOnPageSeconds: Math.floor((Date.now() - this.pageStartTime) / 1000),
    });
  }

  private trackEvent(event: AnalyticsEvent): void {
    if (!this.db || !this.visitorUuid || !this.sessionId) {
      // Silently fail if not initialized - don't spam console
      return;
    }

    const eventData = {
      id: Date.now() + Math.random(), // Unique ID
      visitorUuid: this.visitorUuid,
      sessionId: this.sessionId,
      ...event,
      timestamp: new Date().toISOString(),
      sent: false,
    };

    // Store in IndexedDB
    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.add(eventData);
    } catch (error) {
      console.error('Error storing analytics event:', error);
    }
  }

  async flushOnCheckout(): Promise<void> {
    console.log('🔄 Flushing analytics events on checkout...');
    await this.flushEvents(false);
  }

  async flushOnOrderComplete(): Promise<void> {
    console.log('🔄 Flushing analytics events on order complete...');
    await this.flushEvents(false);
  }

  private async flushEvents(isUnload: boolean = false): Promise<void> {
    if (!this.db || !this.visitorUuid || !this.sessionId) {
      console.log('⚠️ Analytics not initialized, cannot flush events');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        // Get all events and filter for unsent ones
        const request = store.getAll();

        request.onsuccess = async () => {
          const allEvents = request.result || [];
          
          // Filter for unsent events and current session
          const sessionEvents = allEvents.filter((e: any) => 
            e.sessionId === this.sessionId && e.sent === false
          );
          
          if (sessionEvents.length === 0) {
            console.log('📊 No unsent analytics events to flush');
            resolve();
            return;
          }
        
        console.log(`📊 Flushing ${sessionEvents.length} analytics events to server...`);

        const deviceInfo: DeviceInfo = {
          type: this.getDeviceType(),
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          referrer: document.referrer || 'direct',
        };

        const payload = {
          visitorUuid: this.visitorUuid,
          sessionId: this.sessionId,
          events: sessionEvents.map((e: any) => ({
            eventType: e.eventType,
            eventCategory: e.eventCategory,
            pageRoute: e.pageRoute,
            viewState: e.viewState,
            elementId: e.elementId,
            elementName: e.elementName,
            elementType: e.elementType,
            metadata: e.metadata || {},
            timeOnPageSeconds: e.timeOnPageSeconds,
            scrollPosition: e.scrollPosition,
            timestamp: e.timestamp,
          })),
          deviceInfo,
        };

          if (isUnload) {
            // Use sendBeacon for page unload
            console.log('📤 Sending analytics events via sendBeacon (page unload)...');
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            const sent = navigator.sendBeacon('/api/analytics/events', blob);
            if (sent) {
              console.log('✅ Analytics events sent via sendBeacon');
            } else {
              console.warn('⚠️ sendBeacon failed - events remain in IndexedDB');
            }
            resolve(); // Resolve immediately for sendBeacon (fire and forget)
          } else {
            // Regular fetch
            console.log('📤 Sending analytics events via fetch...');
            fetch('/api/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            .then(async (response) => {
              if (response.ok) {
                const result = await response.json();
                console.log(`✅ Analytics events sent successfully: ${result.eventsProcessed || sessionEvents.length} events processed`);
                
                // Mark events as sent
                const writeTransaction = this.db!.transaction([STORE_NAME], 'readwrite');
                const writeStore = writeTransaction.objectStore(STORE_NAME);
                
                sessionEvents.forEach((event: any) => {
                  event.sent = true;
                  writeStore.put(event);
                });
                
                resolve();
              } else {
                const errorText = await response.text();
                console.error('❌ Failed to send analytics events - server error:', response.status, errorText);
                // Events remain in IndexedDB for retry
                resolve(); // Resolve anyway to not block UI
              }
            })
            .catch((error) => {
              console.error('❌ Failed to send analytics events:', error);
              // Events remain in IndexedDB for retry
              resolve(); // Resolve anyway to not block UI
            });
          }
        };

        request.onerror = () => {
          console.error('❌ Error reading events from IndexedDB:', request.error);
          resolve(); // Resolve anyway to not block UI
        };
      } catch (error) {
        console.error('❌ Error setting up flush:', error);
        reject(error);
      }
    });
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  async updateSessionInfo(orderId?: string, customerPhone?: string, customerName?: string): Promise<void> {
    if (!this.sessionId) return;
    
    try {
      await fetch('/api/analytics/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          orderId,
          customerPhone,
          customerName,
          completedOrder: !!orderId,
        }),
      });
    } catch (error) {
      console.error('Failed to update session info:', error);
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  analytics.init().catch(console.error);
}

