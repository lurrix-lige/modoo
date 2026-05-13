import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/env';

interface VisitRecord {
  firstVisit: boolean;
  firstVisitTime: string;
  lastVisitTime: string;
  visitCount: number;
  lastContentId?: string;
}

export function useVisitTracker() {
  const [visitRecord, setVisitRecord] = useState<VisitRecord | null>(null);

  useEffect(() => {
    loadVisitRecord();
  }, []);

  const loadVisitRecord = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VISIT_RECORD);
      if (stored) {
        const record = JSON.parse(stored) as VisitRecord;
        setVisitRecord(record);
        updateVisitRecord(record);
      } else {
        createNewVisitRecord();
      }
    } catch {
      createNewVisitRecord();
    }
  };

  const createNewVisitRecord = async (): Promise<void> => {
    const now = new Date().toISOString();
    const newRecord: VisitRecord = {
      firstVisit: true,
      firstVisitTime: now,
      lastVisitTime: now,
      visitCount: 1,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.VISIT_RECORD, JSON.stringify(newRecord));
    setVisitRecord(newRecord);
  };

  const updateVisitRecord = async (record: VisitRecord): Promise<void> => {
    const updated: VisitRecord = {
      ...record,
      firstVisit: false,
      lastVisitTime: new Date().toISOString(),
      visitCount: record.visitCount + 1,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.VISIT_RECORD, JSON.stringify(updated));
    setVisitRecord(updated);
  };

  const resetVisitRecord = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.VISIT_RECORD);
    createNewVisitRecord();
  };

  return {
    isFirstVisit: visitRecord?.firstVisit ?? true,
    visitCount: visitRecord?.visitCount ?? 0,
    lastVisitTime: visitRecord?.lastVisitTime,
    resetVisitRecord,
  };
}