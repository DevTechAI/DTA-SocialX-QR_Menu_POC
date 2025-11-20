// Service Worker for Push Notifications
// This enables notifications to work even when browser tab is not active

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim()); // Take control of all pages
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Order Received! 🎉';
  const options = {
    body: data.body || 'You have a new order',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'new-order',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' || client.url.includes('order-admin')) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/order-admin');
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle new order notifications from main thread
  if (event.data && event.data.type === 'NEW_ORDER') {
    const order = event.data.order;
    const title = 'New Order Received! 🎉';
    const body = [
      `Customer: ${order.customer_name}`,
      `Items: ${order.items}`,
      `Total: ₹${order.total_amount}`,
      order.table_number ? `Table: ${order.table_number}` : ''
    ].filter(Boolean).join('\n');
    
    const options = {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `order-${order.id}`,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      data: { orderId: order.id, url: '/order-admin' },
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

