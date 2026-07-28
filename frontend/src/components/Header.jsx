import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function IconFilm({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M2 12h20" />
    </svg>
  )
}

function IconStar({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9L12 2.5z" />
    </svg>
  )
}

function IconManga({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  )
}

function IconMusic({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function IconBook({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
      <path d="M12 2v20" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Films/Séries', to: '/', Icon: IconFilm },
  { label: 'Mangas', disabled: true, Icon: IconManga },
  { label: 'Musiques', disabled: true, Icon: IconMusic },
  { label: 'Livres', disabled: true, Icon: IconBook },
]

function navLinkClass({ isActive }) {
  return isActive
    ? 'inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors border-b-2 border-blue-400 pb-1'
    : 'inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors'
}

function favoritesLinkClass({ isActive }) {
  return isActive
    ? 'inline-flex items-center gap-1.5 text-sm font-medium text-yellow-400 border-b-2 border-yellow-400 pb-0.5'
    : 'inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-yellow-300 transition-colors'
}

function mobileNavLinkClass({ isActive }) {
  return isActive
    ? 'text-xl font-medium text-blue-400 hover:text-blue-300 transition-colors block group'
    : 'text-xl font-medium text-gray-300 hover:text-white transition-colors block'
}

function mobileFavoritesLinkClass({ isActive }) {
  return isActive
    ? 'text-xl font-medium text-yellow-400 hover:text-yellow-300 transition-colors block group'
    : 'text-xl font-medium text-gray-300 hover:text-white transition-colors block'
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between relative">
          <div className="flex items-center gap-4 md:gap-6">
            <NavLink
              to="/"
              className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 bg-clip-text text-transparent"
            >
              TrendSnap
            </NavLink>
            <NavLink to="/favoris" className={favoritesLinkClass}>
              <IconStar className="w-3.5 h-3.5" />
              Favoris
            </NavLink>
          </div>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {NAV_LINKS.map((link) => {
                const { Icon } = link
                return (
                  <li key={link.label}>
                    {link.disabled ? (
                      <span className="inline-flex items-center gap-2 text-gray-600 cursor-not-allowed">
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </span>
                    ) : (
                      <NavLink to={link.to} className={navLinkClass} end={link.to === '/'}>
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </NavLink>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          <button
            onClick={toggleMenu}
            className="md:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-1.5 group"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-pink-500 via-blue-500 to-green-500" />
      </header>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-in-out ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={toggleMenu}
        />

        <div
          className={`absolute right-0 top-0 h-full w-3/4 max-w-sm bg-zinc-900/95 backdrop-blur-xl shadow-2xl border-l border-white/10 transition-transform duration-500 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-20 px-8">
            <div className="mb-8 pb-4 border-b border-white/10">
              <h2 className="text-sm text-gray-500 font-medium uppercase tracking-wider">Menu</h2>
            </div>

            <nav className="flex-1">
              <ul className="space-y-6">
                <li>
                  <NavLink to="/favoris" className={mobileFavoritesLinkClass} onClick={closeMenu}>
                    {({ isActive }) =>
                      isActive ? (
                        <span className="flex items-center gap-3">
                          <span className="w-1 h-6 bg-yellow-400 rounded-full" />
                          <IconStar className="w-5 h-5" />
                          Favoris
                        </span>
                      ) : (
                        <span className="flex items-center gap-3">
                          <IconStar className="w-5 h-5" />
                          Favoris
                        </span>
                      )
                    }
                  </NavLink>
                </li>
                {NAV_LINKS.map((link) => {
                  const { Icon } = link
                  return (
                    <li key={link.label}>
                      {link.disabled ? (
                        <span className="flex items-center gap-3 text-xl font-medium text-gray-600 cursor-not-allowed">
                          <Icon className="w-5 h-5" />
                          {link.label}
                        </span>
                      ) : (
                        <NavLink to={link.to} className={mobileNavLinkClass} end={link.to === '/'} onClick={closeMenu}>
                          {({ isActive }) =>
                            isActive ? (
                              <span className="flex items-center gap-3">
                                <span className="w-1 h-6 bg-blue-400 rounded-full" />
                                <Icon className="w-5 h-5" />
                                {link.label}
                              </span>
                            ) : (
                              <span className="flex items-center gap-3">
                                <Icon className="w-5 h-5" />
                                {link.label}
                              </span>
                            )
                          }
                        </NavLink>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="pt-8 border-t border-white/10">
              <p className="text-xs text-gray-500">© 2026 TrendSnap</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
