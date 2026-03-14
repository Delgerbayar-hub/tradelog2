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

          {/* Divider */}
          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted">эсвэл</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={busy} className="btn-ghost w-full justify-center py-2.5 gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">Google-ээр нэвтрэх</span>
              </button>
            </>
          )}

          {/* Mode switchers */}
          <div className="text-center text-xs text-muted pt-1">
            {mode === 'login' && <>
              Бүртгэл байхгүй юу?{' '}
              <button onClick={() => clear('register')} className="text-accent hover:underline">Бүртгүүлэх</button>
            </>}
            {mode === 'register' && <>
              Бүртгэлтэй юу?{' '}
              <button onClick={() => clear('login')} className="text-accent hover:underline">Нэвтрэх</button>
            </>}
            {mode === 'reset' && <>
              <button onClick={() => clear('login')} className="text-accent hover:underline">← Буцах</button>
            </>}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-4">Таны өгөгдөл хувийн бөгөөд зөвхөн танд харагдана</p>
      </div>
    </div>
  )
}
