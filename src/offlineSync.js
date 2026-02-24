// offlineSync.js
// Utilidad para sincronización offline de acciones

const STORAGE_KEY = 'asistencia_offline_queue';

export function addToOfflineQueue(action) {
  const queue = getOfflineQueue();
  queue.push(action);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue() {
  const queue = localStorage.getItem(STORAGE_KEY);
  return queue ? JSON.parse(queue) : [];
}

export function clearOfflineQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

export function syncOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  queue.forEach(async (action) => {
    try {
      await fetch(action.url, action.options);
    } catch (err) {
      // Si falla, deja en la cola
    }
  });
  clearOfflineQueue();
}

export function setupSyncOnReconnect() {
  window.addEventListener('online', syncOfflineQueue);
}
