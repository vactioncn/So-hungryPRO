import { HistoryItem } from '../types';

const DB_NAME = 'GourmetLensDB';
const STORE_NAME = 'history';
const DB_VERSION = 1;

// Simple wrapper for IndexedDB
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('Database error: ' + (event.target as IDBOpenDBRequest).error);

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveHistoryItem = async (item: HistoryItem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Could not save history item');
  });
};

export const getHistoryItems = async (): Promise<HistoryItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    // Use a cursor or getAll. getAll is simpler for small-ish lists.
    // If list is huge, we'd want pagination, but for personal use getAll is fine.
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp descending
      const results = request.result as HistoryItem[];
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject('Could not fetch history');
  });
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
  
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Could not delete history item');
    });
  };