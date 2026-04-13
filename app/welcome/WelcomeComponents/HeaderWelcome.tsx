"use client"
import React from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

export const HeaderWelcome = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 px-6 py-4 transition-all duration-300"
      style={{
        background: isDark ? 'rgba(3,7,18,0.85)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: isDark
          ? '1px solid rgba(99,102,241,0.12)'
          : '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
              />
            </svg>
          </div>
          <span
            className="font-black text-lg tracking-tight transition-colors duration-300"
            style={{ color: isDark ? '#ffffff' : '#0f172a' }}
          >
            IT-Колледж
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {['Программы', 'О нас', 'Преподаватели', 'Отзывы'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.8)' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = isDark ? '#ffffff' : '#0f172a' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = isDark ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.8)' }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.08)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.15)',
              color: isDark ? '#a5b4fc' : '#6366f1',
            }}
            aria-label="Переключить тему"
          >
            {isDark ? (
              /* Sun icon */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              /* Moon icon */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6 9.77 9.77 0 0 1 8.998 2.247 9.75 9.75 0 0 0 12 21.75c3.357 0 6.318-1.69 8.143-4.28a9.68 9.68 0 0 1-2.39-2.468Z" />
              </svg>
            )}
          </button>

          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
            style={{ color: isDark ? 'rgba(148,163,184,0.75)' : 'rgba(71,85,105,0.8)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = isDark ? '#ffffff' : '#0f172a' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = isDark ? 'rgba(148,163,184,0.75)' : 'rgba(71,85,105,0.8)' }}
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold px-5 py-2.5 rounded-lg text-white transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.35)',
            }}
          >
            Поступить
          </Link>
        </div>
      </div>
    </header>
  )
}
