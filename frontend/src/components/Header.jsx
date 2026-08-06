import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import trendSnapLogo from '../assets/TrendSnap-logo1.png'

function IconHeart({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428a5 5 0 1 1 7.5-6.572 5 5 0 1 1 7.5 6.572z" />
    </svg>
  )
}

function favoritesLinkClass({ isActive }) {
  return isActive
    ? 'inline-flex items-center gap-1.5 rounded-lg border border-white bg-white/10 px-3 py-1.5 text-sm font-medium text-white'
    : 'inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white'
}

function BrandLogo({ className = 'text-2xl' }) {
  return (
    <NavLink 
      to="/" 
      className={`inline-flex items-center gap-2 font-bold tracking-tight leading-none ${className}`}
    >
      <img src={trendSnapLogo} alt="" className="h-8 w-8 shrink-0" />
      <span className="inline-flex items-center">
        <span className="text-white">Trend</span>
        <span className="bg-gradient-to-r from-[#c026d3] to-[#7c3aed] bg-clip-text text-transparent">
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
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-[var(--bg-app)]/90 backdrop-blur-md lg:left-[var(--sidebar-width)]">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandLogo className="text-xl" />
          </div>
          <div className="hidden lg:block" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <NavLink to="/favoris" className={favoritesLinkClass}>
              <IconHeart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoris</span>
            </NavLink>

            <button
              type="button"
              onClick={toggleMenu}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
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
        </div>
      </header>

      {/* Sidebar desktop */}
      <div className="fixed top-0 bottom-0 left-0 z-50 hidden w-[var(--sidebar-width)] flex-col border-r border-white/10 bg-[var(--bg-sidebar)] pt-6 lg:flex">
        <div className="px-4 pb-6">
          <BrandLogo />
        </div>
        <div className="flex-1 overflow-y-auto px-0 pb-8">
          <AppSidebar />
        </div>
      </div>

      {/* Drawer mobile / tablette */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} aria-hidden="true" />
        <div
          className={`absolute top-0 left-0 h-full w-[min(20rem,85vw)] border-r border-white/10 bg-[var(--bg-sidebar)] shadow-2xl transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col pt-16 pb-8 overflow-y-auto">
            <AppSidebar onNavigate={closeMenu} />
            <p className="mt-auto pt-8 px-3 text-xs text-zinc-600">© 2026 TrendSnap</p>
          </div>
        </div>
      </div>
    </>
  )
}
