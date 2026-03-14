// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User, onAuthStateChanged, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, gProvider } from '../lib/firebase'

interface Ctx {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  loginEmail: (email: string, password: string) => Promise<void>
  registerEmail: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<Ctx>({} as Ctx)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setLoading(false) }), [])

  return (
    <Ctx.Provider value={{
      user, loading,
      login:         () => signInWithPopup(auth, gProvider).then(() => {}),
      loginEmail:    (email, password) => signInWithEmailAndPassword(auth, email, password).then(() => {}),
      registerEmail: (email, password) => createUserWithEmailAndPassword(auth, email, password).then(() => {}),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      logout:        () => signOut(auth),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
