import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/stores/authStore'

export default function AccountMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const nav = useNavigate()

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const initial = user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="w-8 h-8 rounded-full bg-black hover:bg-[var(--color-bg-hover)] grid place-items-center text-white font-bold text-sm">
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-[#282828] shadow-2xl ring-1 ring-white/5 py-1.5 z-50">
          {user ? (
            <>
              <div className="px-3 py-2 text-xs text-[var(--color-text-muted)]">{user.email}</div>
              <Item onClick={() => { setOpen(false); nav(`/user/${user.id}`) }}>Profile</Item>
              <Item onClick={() => { setOpen(false); nav('/settings') }}>Settings</Item>
              <div className="h-px bg-white/10 my-1" />
              <Item onClick={() => { setOpen(false); signOut() }}>Log out</Item>
            </>
          ) : (
            <>
              <Item onClick={() => { setOpen(false); nav('/login') }}>Log in</Item>
              <Item onClick={() => { setOpen(false); nav('/settings') }}>Settings</Item>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Item({ onClick, children }: { onClick: () => void; children: any }) {
  return <button onClick={onClick} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10">{children}</button>
}
