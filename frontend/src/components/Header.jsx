import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Films/Séries', href: '#', active: true },
  { label: 'Mangas', href: '#' },
  { label: 'Musiques', href: '#' },
  { label: 'Livres', href: '#' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen((open) => !open)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between relative">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 bg-clip-text text-transparent">
            TrendSnap
          </h1>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={
                      link.active
                        ? 'text-blue-400 hover:text-blue-300 transition-colors border-b-2 border-blue-400 pb-1'
                        : 'text-gray-400 hover:text-white transition-colors'
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className={
                        link.active
                          ? 'text-xl font-medium text-blue-400 hover:text-blue-300 transition-colors block group'
                          : 'text-xl font-medium text-gray-300 hover:text-white transition-colors block'
                      }
                      onClick={toggleMenu}
                    >
                      {link.active ? (
                        <span className="flex items-center gap-3">
                          <span className="w-1 h-6 bg-blue-400 rounded-full" />
                          {link.label}
                        </span>
                      ) : (
                        link.label
                      )}
                    </a>
                  </li>
                ))}
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
