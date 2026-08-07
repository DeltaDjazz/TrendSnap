import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { PLATFORMS } from '../platforms'
import { CATEGORY_LINKS } from '../navCategories'

function IconFilm({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M2 12h20" />
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

const CATEGORY_ICONS = {
  'Films/Séries': IconFilm,
  Mangas: IconManga,
  Musiques: IconMusic,
  Livres: IconBook,
}

function categoryClass({ isActive }) {
  return isActive
    ? 'flex items-center gap-2.5  border-l-4 border-red-500 bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/5 px-3 py-2 text-sm text-red-400 font-semibold'
    : 'flex items-center gap-2.5  px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white'
}

export function AppSidebar({ onNavigate, className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleAnchorClick = (event, anchor) => {
    event.preventDefault()
    const scrollToAnchor = () => {
      const el = document.getElementById(anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    if (location.pathname === '/' || location.pathname === '') {
      scrollToAnchor()
      window.history.replaceState(null, '', `#${anchor}`)
      onNavigate?.()
      return
    }

    navigate({ pathname: '/', hash: anchor })
    onNavigate?.()
    requestAnimationFrame(() => {
      setTimeout(scrollToAnchor, 50)
    })
  }

  return (
    <nav className={`flex flex-col gap-8 ${className}`}>
      <div>
        <ul className="space-y-1">
          {CATEGORY_LINKS.map((link) => {
            const Icon = CATEGORY_ICONS[link.label] ?? IconFilm
            return (
              <li key={link.label}>
                {link.disabled ? (
                  <span className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600">
                    <Icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </span>
                ) : (
                  <NavLink to={link.to} end={link.to === '/'} className={categoryClass} onClick={() => onNavigate?.()}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </NavLink>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="border-t border-b border-white/10 pt-3 bg-gradient-to-b from-zinc-900/90 to-zinc-900/80">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Plateformes</p>
        <ul className="space-y-1">
          {PLATFORMS.map((platform) => (
            <li key={platform.id}>
              <a
                href={`/#${platform.anchor}`}
                onClick={(event) => handleAnchorClick(event, platform.anchor)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: platform.colorHex }}
                  aria-hidden="true"
                />
                <img src={platform.logo} alt="" className="h-5 w-auto max-w-[7rem] object-contain object-left opacity-90" />
                <span className="sr-only">{platform.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
