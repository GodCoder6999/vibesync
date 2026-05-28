import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp } = useAuth()

  if (!supabase) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Supabase not configured</h1>
          <p className="text-[var(--color-text-muted)]">Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your Vercel env vars to enable login.</p>
        </div>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    const r = mode === 'in' ? await signIn(email, password) : await signUp(email, password, name)
    setBusy(false)
    if (r.error) setErr(r.error)
    else nav('/')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-black text-white p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--color-bg-panel)]">
        <h1 className="text-3xl font-extrabold mb-2">{mode === 'in' ? 'Log in to VibeSync' : 'Sign up for free'}</h1>
        <p className="text-[var(--color-text-muted)] mb-6 text-sm">{mode === 'in' ? 'New here? ' : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr('') }} className="text-[var(--color-accent)] hover:underline">{mode === 'in' ? 'Sign up' : 'Log in'}</button>
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'up' && (
            <Field label="Display name" value={name} onChange={setName} required />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />
          {err && <div className="text-sm text-red-400">{err}</div>}
          <button type="submit" disabled={busy} className="mt-2 px-6 py-3 rounded-full bg-[var(--color-accent)] text-black font-bold hover:scale-[1.02] disabled:opacity-60">
            {busy ? '…' : mode === 'in' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <div className="mt-6 text-xs text-center text-[var(--color-text-muted)]">
          <Link to="/" className="hover:underline">← Skip and browse</Link>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <label className="text-xs font-bold text-white uppercase">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-3 rounded bg-black border border-white/20 text-white font-normal text-base outline-none focus:border-white"
      />
    </label>
  )
}
