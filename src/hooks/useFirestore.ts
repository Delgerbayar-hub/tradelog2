// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trade, UserSettings } from '../types';

export function useFirestore(userId: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // ── Real-time trades listener ──
  useEffect(() => {
    if (!userId) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'trades'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const data: Trade[] = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          ...raw,
          id: d.id,
          createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(),
          updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt.toDate() : new Date(),
          screenshotBefore: raw.screenshotBefore || [],
          screenshotAfter: raw.screenshotAfter || [],
        } as Trade;
      });
      setTrades(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  // ── User settings listener ──
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, 'userSettings', userId), snapshot => {
      if (snapshot.exists()) {
        setUserSettings(snapshot.data() as UserSettings);
      } else {
        // Default settings
        setUserSettings({
          userId,
          pairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NASDAQ'],
          accounts: [],
        });
      }
    });

    return () => unsub();
  }, [userId]);

  // ── Add trade ──
  const addTrade = async (
    tradeData: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!userId) { console.error('[addTrade] userId байхгүй'); return; }
    try {
      await addDoc(collection(db, 'trades'), {
        ...tradeData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[addTrade] Firestore алдаа:', err);
      alert(`Trade хадгалахад алдаа гарлаа:\n${(err as Error).message}`);
    }
  };

  // ── Update trade ──
  const updateTrade = async (
    tradeId: string,
    tradeData: Partial<Omit<Trade, 'id' | 'userId' | 'createdAt'>>
  ) => {
    try {
      await updateDoc(doc(db, 'trades', tradeId), {
        ...tradeData,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[updateTrade] Firestore алдаа:', err);
      alert(`Trade шинэчлэхэд алдаа гарлаа:\n${(err as Error).message}`);
    }
  };

  // ── Delete trade ──
  const deleteTrade = async (tradeId: string) => {
    await deleteDoc(doc(db, 'trades', tradeId));
  };

  // ── Update user settings (pairs, accounts) ──
  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!userId) return;
    const ref = doc(db, 'userSettings', userId);
    await setDoc(ref, { ...settings, userId }, { merge: true });
  };

  return {
    trades,
    loading,
    userSettings,
    addTrade,
    updateTrade,
    deleteTrade,
    updateUserSettings,
  };
}