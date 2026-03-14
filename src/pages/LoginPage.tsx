// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

type Mode = 'login' | 'register' | 'reset'

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential':       'И-мэйл эсвэл нууц үг буруу байна',
  'auth/user-not-found':           'Бүртгэлтэй хэрэглэгч олдсонгүй',
  'auth/wrong-password':           'Нууц үг буруу байна',
  'auth/email-already-in-use':     'Энэ и-мэйл аль хэдийн бүртгэлтэй байна',
  'auth/weak-password':            'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой',
  'auth/invalid-email':            'И-мэйл хаяг буруу байна',
  'auth/too-many-requests':        'Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу',
  'auth/network-request-failed':   'Сүлжээний алдаа. Интернэт холболтоо шалгана уу',
  'auth/popup-closed-by-user':     'Google нэвтрэлт цуцлагдлаа',
}

function getMsg(e: unknown) {
  const code = (e as { code?: string })?.code ?? ''
  return FIREBASE_ERRORS[code] ?? (e as Error)?.message ?? 'Алдаа гарлаа'
}

export default function LoginPage() {
  const { login, loginEmail, registerEmail, resetPassword } = useAuth()

  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')
  const [resetSent, setResetSent] = useState(false)

  const clear = (m: Mode) => { setMode(m); setErr(''); setResetSent(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')

    if (mode === 'register' && password !== confirm) {
      return setErr('Нууц үг таарахгүй байна')
    }

    setBusy(true)
    try {
      if (mode === 'login')    await loginEmail(email, password)
      if (mode === 'register') await registerEmail(email, password)
      if (mode === 'reset') {
        await resetPassword(email)
        setResetSent(true)
      }
    } catch (ex) {
      setErr(getMsg(ex))
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setErr(''); setBusy(true)
    try { await login() } catch (ex) { setErr(getMsg(ex)) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm fade-in">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-zinc-100 tracking-tight">TradeLog</span>
        </div>

        <div className="card p-7 space-y-5">
          {/* Title */}
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">
              {mode === 'login'    && 'Нэвтрэх'}
              {mode === 'register' && 'Бүртгүүлэх'}
              {mode === 'reset'    && 'Нууц үг сэргээх'}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {mode === 'login'    && 'Арилжааны тэмдэглэлдээ нэвтрэнэ үү'}
              {mode === 'register' && 'Шинэ бүртгэл үүсгэнэ үү'}
              {mode === 'reset'    && 'И-мэйлдээ нууц үг сэргээх холбоос авна уу'}
            </p>
          </div>

          {/* Error */}
          {err && (
            <div className="text-xs text-red bg-red/8 border border-red/20 px-3 py-2.5 rounded-lg">
              {err}
            </div>
          )}

          {/* Reset sent */}
          {resetSent && (
            <div className="text-xs text-green bg-green/8 border border-green/20 px-3 py-2.5 rounded-lg">
              Нууц үг сэргээх холбоос илгээлээ. И-мэйлээ шалгана уу.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="И-мэйл хаяг"
                className="input pl-9"
              />
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Нууц үг"
                  className="input pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-zinc-300 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}

            {/* Confirm password */}
            {mode === 'register' && (
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'} required value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Нууц үг давтах"
                  className="input pl-9"
                />
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => clear('reset')}
                  className="text-xs text-muted hover:text-accent transition-colors">
                  Нууц үг мартсан?
                </button>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={busy}
              className="btn-primary w-full justify-center py-2.5 mt-1">
              {busy
                ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                : <>
                    {mode === 'login'    && 'Нэвтрэх'}
                    {mode === 'register' && 'Бүртгүүлэх'}
                    {mode === 'reset'    && 'Холбоос илгээх'}
                    <ArrowRight size={14} />
                  </>
              }
            </button>
          </form>

          {/* Mode switchers */}
          <div className="text-center text-xs text-muted pt-1">
            {mode === 'reset' && (
              <button onClick={() => clear('login')} className="text-accent hover:underline">← Буцах</button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-4">Таны өгөгдөл хувийн бөгөөд зөвхөн танд харагдана</p>
      </div>
    </div>
  )
}
