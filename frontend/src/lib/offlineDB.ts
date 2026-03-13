import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GramHealthDB extends DBSchema {
  patients: {
    key: string;
    value: {
      offlineId: string;
      name: string;
      age: number;
      gender: string;
      village: string;
      phone?: string;
      medicalHistory?: string;
      allergies?: string;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-synced': boolean };
  };
  consultations: {
    key: string;
    value: {
      offlineId: string;
      patientOfflineId: string;
      symptoms: any[];
      triageResult?: any;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-synced': boolean };
  };
  cache: {
    key: string;
    value: { data: any; timestamp: number };
  };
}

let dbPromise: Promise<IDBPDatabase<GramHealthDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GramHealthDB>('gramhealth-offline', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'offlineId' });
          patientStore.createIndex('by-synced', 'synced');

          const consultationStore = db.createObjectStore('consultations', { keyPath: 'offlineId' });
          consultationStore.createIndex('by-synced', 'synced');

          db.createObjectStore('cache', { keyPath: 'key' } as any);
        }
      }
    });
  }
  return dbPromise;
}

export const offlineDB = {
  // Patients
  async savePatient(patient: Omit<GramHealthDB['patients']['value'], 'offlineId' | 'createdAt' | 'synced'>) {
    const db = await getDB();
    const record = {
      ...patient,
      offlineId: 'offline-pat-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      synced: false
    };
    await db.put('patients', record);
    return record;
  },

  async getAllPatients() {
    const db = await getDB();
    return db.getAll('patients');
  },

  async getUnsyncedPatients() {
    const db = await getDB();
    return db.getAllFromIndex('patients', 'by-synced', false);
  },

  async markPatientSynced(offlineId: string) {
    const db = await getDB();
    const patient = await db.get('patients', offlineId);
    if (patient) {
      patient.synced = true;
      await db.put('patients', patient);
    }
  },

  // Consultations
  async saveConsultation(consultation: Omit<GramHealthDB['consultations']['value'], 'offlineId' | 'createdAt' | 'synced'>) {
    const db = await getDB();
    const record = {
      ...consultation,
      offlineId: 'offline-con-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      synced: false
    };
    await db.put('consultations', record);
    return record;
  },

  async getUnsyncedConsultations() {
    const db = await getDB();
    return db.getAllFromIndex('consultations', 'by-synced', false);
  },

  // API cache
  async cacheResponse(key: string, data: any) {
    const db = await getDB();
    await db.put('cache', { key, data, timestamp: Date.now() } as any);
  },

  async getCached(key: string, maxAgeMs = 5 * 60 * 1000) {
    const db = await getDB();
    const record = await db.get('cache', key);
    if (!record) return null;
    if (Date.now() - record.timestamp > maxAgeMs) return null;
    return record.data;
  },

  async clearOldCache() {
    const db = await getDB();
    const all = await db.getAll('cache');
    const tx = db.transaction('cache', 'readwrite');
    for (const item of all) {
      if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
        await tx.store.delete(item.key as string);
      }
    }
    await tx.done;
  }
};

export default offlineDB;
