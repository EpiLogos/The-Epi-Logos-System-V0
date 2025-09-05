"use client"

import React, { useMemo, useRef, useState } from "react"
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { UserRound } from "lucide-react"
import { useAuth } from "@/auth/auth-context"
import UserAvatar from "@/components/ui/UserAvatar"
import { useNavbarToggle } from "@/hooks/useNavbarToggle"
import { useSmartPositioning } from "@/hooks/useSmartPositioning"
import { NavbarToggle } from "@/components/ui/NavbarToggle"

// Lightweight coordinate badge, just shows coordinate number (no subsystem name)
function CoordinateBadge() {
  const [coordinate, setCoordinate] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      const el = document.querySelector('[data-coordinate]') as HTMLElement | null
      const coord = el?.getAttribute('data-coordinate') || null
      setCoordinate(coord)
    } catch { setCoordinate(null) }
  }, [])

  if (!coordinate) return null
  return (
    <div className="text-xs tracking-wide text-white/60 select-none pointer-events-none">
      {coordinate}
    </div>
  )
}

interface Mode {
  id: string
  name: string
  colors: {
    primary: string
    light: string
    wash: string
  }
  symbol: React.ReactNode
  description: string
  details: {
    subtitle: string
    overview: string
    links: { title: string; href: string }[]
  }
}

const modes: Mode[] = [
  {
    id: 'epii',
    name: 'EPII',
    colors: {
      primary: '#6B46C1',
      light: '#DDD6FE',
      wash: 'rgba(107, 70, 193, 0.08)'
    },
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L13 6L8 10L3 6L8 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    description: 'Knowledge Formation',
    details: {
      subtitle: 'Crystalline Knowledge Architecture',
      overview: 'Explore the geometric structures of consciousness where information transforms into wisdom through sacred mathematical relationships.',
      links: [
        { title: 'Knowledge Patterns', href: '/subsystems/epii/patterns' },
        { title: 'Crystalline Forms', href: '/subsystems/epii/forms' },
        { title: 'Information Geometry', href: '/subsystems/epii/geometry' }
      ]
    }
  },
  {
    id: 'nara',
    name: 'NARA',
    colors: {
      primary: '#059669',
      light: '#D1FAE5',
      wash: 'rgba(5, 150, 105, 0.08)'
    },
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 8C2 8 4 4 8 4C12 4 14 8 14 8C14 8 12 12 8 12C4 12 2 8 2 8Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M3 8C6 8 10 8 13 8" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    description: 'Consciousness Stream',
    details: {
      subtitle: 'Flowing Awareness Dynamics',
      overview: 'Navigate the fluid currents of consciousness as awareness moves through states of being, revealing the natural flow of perception.',
      links: [
        { title: 'Flow States', href: '/subsystems/nara/flow' },
        { title: 'Awareness Streams', href: '/subsystems/nara/streams' },
        { title: 'Perceptual Fluidity', href: '/subsystems/nara/perception' }
      ]
    }
  },
  {
    id: 'mahamaya',
    name: 'MAHAMAYA',
    colors: {
      primary: '#D97706',
      light: '#FEF3C7',
      wash: 'rgba(217, 119, 6, 0.08)'
    },
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    description: 'Symbolic Emanation',
    details: {
      subtitle: 'Archetypal Symbol Networks',
      overview: 'Witness the radial emergence of archetypal symbols as consciousness expresses infinite meaning through sacred symbolic forms.',
      links: [
        { title: 'Symbol Dynamics', href: '/subsystems/mahamaya/symbols' },
        { title: 'Archetypal Forms', href: '/subsystems/mahamaya/archetypes' },
        { title: 'Meaning Emanation', href: '/subsystems/mahamaya/meaning' }
      ]
    }
  },
  {
    id: 'parashakti',
    name: 'PARASHAKTI',
    colors: {
      primary: '#E11D48',
      light: '#FECDD3',
      wash: 'rgba(225, 29, 72, 0.08)'
    },
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 8C4 6 6 10 8 8C10 6 12 10 14 8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M2 10C4 8 6 12 8 10C10 8 12 12 14 10" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    description: 'Vibration & Sound',
    details: {
      subtitle: 'Harmonic Resonance Fields',
      overview: 'Attune to the fundamental frequencies that create reality through vibrational patterns and sacred sound harmonics.',
      links: [
        { title: 'Sound Harmonics', href: '/subsystems/parashakti/sound' },
        { title: 'Resonance Fields', href: '/subsystems/parashakti/resonance' },
        { title: 'Vibrational Patterns', href: '/subsystems/parashakti/vibration' }
      ]
    }
  },
  {
    id: 'paramasiva',
    name: 'PARAMASIVA',
    colors: {
      primary: '#2563EB',
      light: '#DBEAFE',
      wash: 'rgba(37, 99, 235, 0.08)'
    },
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M6 4L10 4M8 6L8 10" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    description: 'Unity Topology',
    details: {
      subtitle: 'Interconnected Unity Networks',
      overview: 'Discover the topological structures of unity that reveal how all consciousness interconnects in perfect geometric harmony.',
      links: [
        { title: 'Unity Networks', href: '/subsystems/paramasiva/networks' },
        { title: 'Topological Forms', href: '/subsystems/paramasiva/topology' },
        { title: 'Interconnected Awareness', href: '/subsystems/paramasiva/awareness' }
      ]
    }
  },
  {
    id: 'anuttara',
    name: 'ANUTTARA',
    colors: {
      primary: '#000000',
      light: '#F8FAFC',
      wash: 'rgba(0, 0, 0, 0.05)'
    },
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L10.5 6H15L11 9.5L12.5 15L8 12L3.5 15L5 9.5L1 6H5.5L8 1Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <circle cx="8" cy="8" r="2" fill="url(#rainbow)" opacity="0.6"/>
        <defs>
          <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="16.66%" stopColor="#ff8800" />
            <stop offset="33.33%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="66.66%" stopColor="#00ffff" />
            <stop offset="83.33%" stopColor="#0088ff" />
            <stop offset="100%" stopColor="#8800ff" />
          </linearGradient>
        </defs>
      </svg>
    ),
    description: 'Archetypal Completeness',
    details: {
      subtitle: 'Perfect Wholeness Integration',
      overview: 'Experience the fullness of archetypal consciousness where all possibilities converge in the ultimate unity of being.',
      links: [
        { title: 'Archetypal Integration', href: '/subsystems/anuttara/integration' },
        { title: 'Complete Synthesis', href: '/subsystems/anuttara/synthesis' },
        { title: 'Infinite Wholeness', href: '/subsystems/anuttara/wholeness' }
      ]
    }
  }
]

export interface EpiiNavigationProps {
  className?: string;
}

export default function EpiiNavigation({ className = "" }: EpiiNavigationProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)
  const hoverTimer = useRef<number | null>(null)

  // Global navbar toggle functionality
  const { isVisible, toggle } = useNavbarToggle()
  const togglePosition = useSmartPositioning()

  // Removed body padding side-effects; spacer below will handle layout shift smoothly

  const setHoverDebounced = (id: string | null) => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    hoverTimer.current = window.setTimeout(() => {
      setHoveredMode(id)
    }, 80)
  }
  const router = useRouter()
  const { isAuthenticated, user, signOut } = useAuth()

  // active mode derives from the current route AND data-coordinate attribute
  const activeId = useMemo(() => {
    if (!pathname) return 'epii'
    // Special cases: main/system pages show neutral logo state
    if (pathname === '/' || pathname === '/system') return null

    // First try /subsystems/<id> pattern
    const routeMatch = modes.find((m) => pathname.startsWith(`/subsystems/${m.id}`))
    if (routeMatch) return routeMatch.id

    // Fallback: read data-coordinate from page and map to subsystem
    try {
      const coordinateEl = document.querySelector('[data-coordinate]')
      const coordinate = coordinateEl?.getAttribute('data-coordinate')
      if (coordinate) {
        const subsystemMatch = coordinate.match(/#([0-5])/)
        if (subsystemMatch) {
          const subsystemId = parseInt(subsystemMatch[1])
          const subsystemMap: Record<number, string> = {
            0: 'anuttara', 1: 'paramasiva', 2: 'parashakti',
            3: 'mahamaya', 4: 'nara', 5: 'epii'
          }
          return subsystemMap[subsystemId] || 'epii'
        }
      }
    } catch {
      // DOM not available or error reading coordinate
    }

    return 'epii'
  }, [pathname])

  const currentMode = useMemo(() =>
    activeId ? modes.find(mode => mode.id === activeId) || modes[0] : modes[0],
    [activeId]
  )

  // Logo coloring logic: on main/scene (activeId=null) use black outer circle,
  // and change inner dot to hovered subsystem color while hovering.
  const { logoOuterBg, logoInnerBg } = useMemo(() => {
    const hovered = hoveredMode ? modes.find(m => m.id === hoveredMode) : undefined
    return {
      logoOuterBg: activeId === null ? '#000000' : currentMode.colors.light,
      logoInnerBg: activeId === null ? '#000000' : (hovered?.colors.primary) || currentMode.colors.primary
    }
  }, [activeId, hoveredMode, currentMode])

  const handleSignIn = React.useCallback(() => {
    router.push('/auth/signin')
  }, [router])

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [signOut, router])

  const handleAccountClick = React.useCallback(() => {
    router.push('/account')
  }, [router])

  const handleModeClick = React.useCallback((modeId: string) => {
    router.push(`/subsystems/${modeId}`)
  }, [router])

  return (
    <LazyMotion features={domAnimation}>
      {/* Navbar Toggle */}
      <NavbarToggle
        isVisible={isVisible}
        onToggle={toggle}
        position={togglePosition}
      />

      {/* Collapsible Navigation */}
      <AnimatePresence mode="wait">
        {isVisible && (
          <m.nav
            className={`w-full bg-black/90 border-b z-50 ${className}`}
            style={{
              borderBottomColor: `${currentMode.colors.primary}20`,
              backgroundColor: 'rgba(0, 0, 0, 0.9)'
            }}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.1, 0.25, 1],
              exit: { duration: 0.3, ease: [0.4, 0, 1, 1] }
            }}
          >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16" style={{ height: '64px' }}>
          {/* Far left: Coordinate text */}
          <div className="flex items-center space-x-6">
            <CoordinateBadge />

            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ backgroundColor: logoOuterBg }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: logoInnerBg }}
                />
              </div>
              <h1 className="text-base tracking-wider text-white opacity-80">Epi:Logos</h1>
            </div>
          </div>

          {/* Navigation Modes */}
          <div className="hidden md:flex items-center space-x-6 ml-8">
            {modes.map((mode) => (
              <div
                key={mode.id}
                className="relative"
                onMouseEnter={() => setHoverDebounced(mode.id)}
                onMouseLeave={() => setHoverDebounced(null)}
              >
                <m.button
                  onClick={() => handleModeClick(mode.id)}
                  className={`
                    relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ease-out
                    ${activeId === mode.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'}
                  `}
                  style={{
                    color: activeId === mode.id ? mode.colors.primary : '#fff',
                    backgroundColor: activeId === mode.id ? mode.colors.wash : 'transparent'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -1
                  }}
                  whileTap={{ scale: 0.98 }}
                  // Avoid heavy mount animations for all items
                >
                    <m.div
                      className="flex items-center justify-center"
                      animate={{ 
                        color: activeId === mode.id ? mode.colors.primary : '#fff',
                        scale: activeId === mode.id ? 1.1 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {mode.symbol}
                    </m.div>
                  
                  {!isCollapsed && (
                    <m.span 
                      className="text-sm tracking-wider"
                      style={{ fontWeight: activeId === mode.id ? 500 : 400 }}
                      layout
                    >
                      {mode.name}
                    </m.span>
                  )}

                  {/* Active indicator */}
                  {activeId === mode.id && (
                    <m.div
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ 
                        backgroundColor: mode.colors.primary
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      layoutId="activeIndicator"
                    />
                  )}
                </m.button>

                {/* Dropdown Menu: keep mounted, toggle visibility/opacity */}
                <div
                  className="absolute top-full mt-2 w-80 bg-black/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 p-6 z-50 transition-all duration-150"
                  style={{
                    borderColor: `${mode.colors.primary}20`,
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    willChange: 'transform, opacity',
                    opacity: hoveredMode === mode.id ? 1 : 0,
                    visibility: hoveredMode === mode.id ? 'visible' : 'hidden',
                    transform: hoveredMode === mode.id ? 'translate(-50%, 0)' : 'translate(-50%, 6px)',
                    left: '50%'
                  }}
                  aria-hidden={hoveredMode !== mode.id}
                >
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: mode.colors.light }}
                    >
                      <div style={{ color: mode.colors.primary }}>
                        {mode.symbol}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base tracking-wider text-white" style={{ color: mode.colors.primary }}>
                        {mode.name}
                      </h3>
                      <p className="text-xs text-gray-400">{mode.details.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-gray-300 mb-6">
                    {mode.details.overview}
                  </p>

                  {/* Links */}
                  <div className="space-y-2">
                    <h4 className="text-xs tracking-wide text-gray-400 mb-3">EXPLORE</h4>
                    {mode.details.links.map((link) => (
                      <a
                        key={link.title}
                        href={link.href}
                        className="block px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/10 text-white"
                        style={{ color: mode.colors.primary }}
                      >
                        {link.title}
                      </a>
                    ))}
                  </div>

                  {/* Accent */}
                  <div className="absolute top-6 right-6 w-16 h-16 opacity-10">
                    <div
                      className="w-full h-full rounded-full border-2"
                      style={{ borderColor: mode.colors.primary }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border"
                      style={{ borderColor: mode.colors.primary }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right-side Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {!isAuthenticated ? (
              <m.button
                onClick={handleSignIn}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 text-white group"
                title="Sign In"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UserRound className="w-5 h-5" />
              </m.button>
            ) : (
              <div className="flex items-center space-x-3">
                <m.button
                  onClick={handleAccountClick}
                  className="flex items-center space-x-2 text-white hover:bg-white/10 rounded-lg px-2 py-1 transition-colors group"
                  title="Go to Account"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserAvatar
                    user={user}
                    size="md"
                    clickable={false}
                    className="group-hover:border-white/40 transition-colors"
                  />
                  <span className="text-sm font-medium group-hover:text-white/90">
                    {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email}
                  </span>
                </m.button>
                <m.button
                  onClick={handleSignOut}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white group"
                  title="Sign Out"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </m.button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <m.button
            className="md:hidden w-8 h-8 flex items-center justify-center text-white"
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <m.div
                className="h-0.5 w-full bg-current rounded-full"
                animate={{
                  rotate: isCollapsed ? 45 : 0,
                  y: isCollapsed ? 2 : 0
                }}
                transition={{ duration: 0.3 }}
              />
              <m.div
                className="h-0.5 w-full bg-current rounded-full"
                animate={{
                  opacity: isCollapsed ? 0 : 1,
                  scale: isCollapsed ? 0 : 1
                }}
                transition={{ duration: 0.3 }}
              />
              <m.div
                className="h-0.5 w-full bg-current rounded-full"
                animate={{
                  rotate: isCollapsed ? -45 : 0,
                  y: isCollapsed ? -2 : 0
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </m.button>
        </div>

        {/* Mobile Menu */}
        <m.div
          className="md:hidden overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: isCollapsed ? 'auto' : 0,
            opacity: isCollapsed ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="py-4 space-y-2">
            {modes.map((mode) => (
              <m.button
                key={mode.id}
                onClick={() => {
                  handleModeClick(mode.id)
                  setIsCollapsed(false)
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300
                  ${activeId === mode.id ? 'opacity-100' : 'opacity-70'}
                `}
                style={{
                  color: activeId === mode.id ? mode.colors.primary : '#fff',
                  backgroundColor: activeId === mode.id ? mode.colors.wash : 'transparent'
                }}
              >
                <div style={{ color: mode.colors.primary }}>
                  {mode.symbol}
                </div>
                <div className="flex-1">
                  <div className="text-sm tracking-wider">{mode.name}</div>
                  <div className="text-xs opacity-60">{mode.description}</div>
                </div>
              </m.button>
            ))}

            {/* Mobile Auth Section */}
            {!isAuthenticated ? (
              <button
                onClick={handleSignIn}
                className="mt-2 block w-full px-4 py-3 rounded-lg bg-white/10 text-white text-sm font-medium border border-white/20"
              >
                <div className="flex items-center justify-center space-x-2">
                  <UserRound className="w-4 h-4" />
                  <span>Sign In</span>
                </div>
              </button>
            ) : (
              <div className="mt-2 flex items-center justify-between px-4 py-3 rounded-lg bg-white/10">
                <button
                  onClick={handleAccountClick}
                  className="flex items-center space-x-2 text-white hover:bg-white/10 rounded-lg px-2 py-1 transition-colors flex-1 text-left"
                  title="Go to Account"
                >
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm">{user?.name}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </m.div>
      </div>

      {/* Subtle geometric accent line */}
      <m.div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${currentMode.colors.primary}20, transparent)`
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
          </m.nav>
        )}
      </AnimatePresence>
      {/* Smooth layout spacer to push content in sync with navbar animation */}
      <m.div
        aria-hidden
        className="w-full"
        initial={{ height: 0 }}
        animate={{ height: isVisible ? 64 : 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </LazyMotion>
  )
}
