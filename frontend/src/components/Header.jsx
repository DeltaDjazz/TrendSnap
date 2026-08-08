import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import trendSnapLogo from '../assets/TrendSnap-logo1.png'

function BrandLogo({ className = 'text-xl' }) {
  return (
    <NavLink
      to="/"
      className={`inline-flex items-center gap-2 font-bold tracking-tight leading-none ${className}`}
    >
      <img src={trendSnapLogo} alt="" className="h-6 w-6 mt-1 shrink-0" />
      <span className="inline-flex items-center">
        <span className="text-white">Trendz</span>
        <span className="bg-gradient-to-r from-[#999] to-[#ddd] bg-clip-text text-transparent">
          Snap
        </span>
      </span>
    </NavLink>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen((open) => !open)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Barre mobile / tablette uniquement */}
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-[var(--bg-app)]/90 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <BrandLogo className="text-xl" />

          <button
            type="button"
            onClick={toggleMenu}
            className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5"
            aria-label="Ouvrir le menu"
            aria-expanded={isMenuOpen}
          >
            <span
              className={`h-0.5 w-5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-white transition-all duration-300 ${
                isMenuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="fixed top-0 bottom-0 left-0 z-50 hidden w-[var(--sidebar-width)] flex-col border-r border-white/10 bg-[var(--bg-sidebar)] pt-6 lg:flex">
        <div className="shrink-0 px-4 pb-6">
          <BrandLogo />
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-0 pb-6">
          <AppSidebar />
        </div>
      </aside>

      {/* Drawer mobile / tablette */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} aria-hidden="true" />
        <div
          className={`absolute top-0 left-0 flex h-full w-[min(20rem,85vw)] flex-col border-r border-white/10 bg-[var(--bg-sidebar)] shadow-2xl transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col pt-16 pb-6">
            <AppSidebar onNavigate={closeMenu} />
            <p className="shrink-0 px-3 pt-4 text-xs text-zinc-600">© 2026 TrendSnap</p>
          </div>
        </div>
      </div>
    </>
  )
}
