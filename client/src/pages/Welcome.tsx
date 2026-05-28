import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="min-h-screen grid place-items-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold mb-4">VibeSync</h1>
        <p className="text-[var(--color-text-muted)] mb-8">Music for everyone.</p>
        <Link to="/" className="inline-block px-8 py-3 rounded-full bg-[var(--color-accent)] text-black font-bold hover:scale-105">
          Get Started
        </Link>
      </div>
    </div>
  )
}
