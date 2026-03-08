// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import type { Account, Trade } from '../types'

function b64(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file) })
}

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setAccounts([]); setLoading(false); return }
    return onSnapshot(query(collection(db,'accounts'), where('userId','==',user.uid), orderBy('createdAt','asc')), snap => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Account))); setLoading(false)
    })
  }, [user])

  const addAccount    = async (d: Omit<Account,'id'|'userId'|'createdAt'>) => { if (!user) return; await addDoc(collection(db,'accounts'), { ...d, userId: user.uid, createdAt: Date.now() }) }
  const updateAccount = (id: string, d: Partial<Account>) => updateDoc(doc(db,'accounts',id), d as any)
  const deleteAccount = (id: string) => deleteDoc(doc(db,'accounts',id))

  return { accounts, loading, addAccount, updateAccount, deleteAccount }
}

export function useTrades(accountId: string | null) {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !accountId) { setTrades([]); setLoading(false); return }
    return onSnapshot(
      query(collection(db,'trades'), where('userId','==',user.uid), where('accountId','==',accountId), orderBy('date','asc'), orderBy('createdAt','asc')),
      snap => { setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trade))); setLoading(false) }
    )
  }, [user, accountId])

  const addTrade = async (data: Omit<Trade,'id'|'userId'|'createdAt'|'screenshotBase64'>, screenshot?: File) => {
    if (!user) return
    const screenshotBase64 = screenshot ? await b64(screenshot) : null
    await addDoc(collection(db,'trades'), { ...data, screenshotBase64, userId: user.uid, createdAt: Date.now() })
  }

  const deleteTrade = (id: string) => deleteDoc(doc(db,'trades',id))

  return { trades, loading, addTrade, deleteTrade }
}
