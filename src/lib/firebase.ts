import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyD8jq3IRgaFG43F5D2ibyFzR-kq-C-vGGs",
  authDomain:        "trade-2026-38e34.firebaseapp.com",
  projectId:         "trade-2026-38e34",
  storageBucket:     "trade-2026-38e34.firebasestorage.app",
  messagingSenderId: "888717352494",
  appId:             "1:888717352494:web:866e901ae08b2b204609bf",
}

const app = initializeApp(firebaseConfig)
export const auth      = getAuth(app)
export const db        = getFirestore(app)
export const gProvider = new GoogleAuthProvider()