'use client';
import { useState, useEffect } from 'react';
import offlineDB from '@/lib/offlineDB';
import api from '@/lib/api';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); triggerSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

async function triggerSync() {
  try {
    const unsynced = await offlineDB.getUnsyncedPatients();
    if (unsynced.length === 0) return;

    const res = await api.post('/patients/sync', { patients: unsynced });
    for (const result of res.data.results) {
      if (result.status === 'created' || result.status === 'skipped') {
        await offlineDB.markPatientSynced(result.offlineId);
      }
    }
    console.log(`✅ Synced ${unsynced.length} offline patients`);
  } catch (err) {
    console.warn('Sync failed, will retry when online');
  }
}
