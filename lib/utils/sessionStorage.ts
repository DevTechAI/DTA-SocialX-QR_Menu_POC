/**
 * 12-Hour Session Storage Utility
 * 
 * Stores data in localStorage with 12-hour expiration.
 * Data is accessible across all tabs/windows in the same browser profile.
 * Automatically clears after 12 hours or when browser is closed (handled by browser).
 */

const STORAGE_PREFIX = 'sx_session_';
const EXPIRY_HOURS = 12;
const EXPIRY_MS = EXPIRY_HOURS * 60 * 60 * 1000; // 12 hours in milliseconds

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Store data with 12-hour expiration
 */
export function setSessionData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const storedData: StoredData<T> = {
    data: value,
    timestamp: now,
    expiry: now + EXPIRY_MS,
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(storedData));
    
    // Trigger custom event for cross-tab synchronization
    window.dispatchEvent(new CustomEvent('sessionStorageUpdated', {
      detail: { key, value: storedData }
    }));
  } catch (error) {
    console.error(`Error storing session data for key "${key}":`, error);
  }
}

/**
 * Get data if it hasn't expired (within 12 hours)
 */
export function getSessionData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!item) return null;

    const storedData: StoredData<T> = JSON.parse(item);
    const now = Date.now();

    // Check if data has expired
    if (now > storedData.expiry) {
      // Data expired, remove it
      removeSessionData(key);
      return null;
    }

    return storedData.data;
  } catch (error) {
    console.error(`Error retrieving session data for key "${key}":`, error);
    return null;
  }
}

/**
 * Remove session data
 */
export function removeSessionData(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    
    // Trigger custom event for cross-tab synchronization
    window.dispatchEvent(new CustomEvent('sessionStorageRemoved', {
      detail: { key }
    }));
  } catch (error) {
    console.error(`Error removing session data for key "${key}":`, error);
  }
}

/**
 * Clear all expired session data
 */
export function clearExpiredSessionData(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let clearedCount = 0;

    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const storedData: StoredData<any> = JSON.parse(item);
            if (now > storedData.expiry) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          // Invalid data, remove it
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });

    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired session data items`);
    }
  } catch (error) {
    console.error('Error clearing expired session data:', error);
  }
}

/**
 * Clear all session data (regardless of expiry)
 */
export function clearAllSessionData(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all session data:', error);
  }
}

/**
 * Check if data exists and is valid (not expired)
 */
export function hasValidSessionData(key: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!item) return false;

    const storedData: StoredData<any> = JSON.parse(item);
    const now = Date.now();

    if (now > storedData.expiry) {
      removeSessionData(key);
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get remaining time until expiry in milliseconds
 */
export function getRemainingTime(key: string): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!item) return null;

    const storedData: StoredData<any> = JSON.parse(item);
    const now = Date.now();

    if (now > storedData.expiry) {
      removeSessionData(key);
      return null;
    }

    return storedData.expiry - now;
  } catch (error) {
    return null;
  }
}

// Clean up expired data on load
if (typeof window !== 'undefined') {
  clearExpiredSessionData();
  
  // Also clean up on visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      clearExpiredSessionData();
    }
  });
  
  // Listen for storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
      // Data was updated in another tab, trigger custom event
      window.dispatchEvent(new CustomEvent('sessionStorageUpdated', {
        detail: { key: e.key.replace(STORAGE_PREFIX, ''), value: e.newValue ? JSON.parse(e.newValue) : null }
      }));
    }
  });
}

