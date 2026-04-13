"use client"
import React from 'react'
import Link from 'next/link'
import { HeaderWelcome } from './WelcomeComponents/HeaderWelcome'

/* ─── Feature cards data ─────────────────────────────── */
const features = [
  {
    color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Учёба в удобное время',
    desc: 'Записи лекций, гибкий график и асинхронное обучение — занимайтесь тогда, когда вам удобно.',
  },
  {
    color: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
    title: 'Практика на реальных кейсах',
    desc: 'Работайте над живыми проектами, создавайте портфолио и решайте настоящие задачи индустрии.',
  },
  {
    color: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: 'Менторы из индустрии',
    desc: 'Наставники — действующие специалисты из крупных IT-компаний, делящиеся реальным опытом.',
  },
  {
    color: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: 'Диплом и помощь с работой',
    desc: 'Получите официальный диплом и поддержку карьерного центра при трудоустройстве.',
  },
]

/* ─── Code editor mockup ─────────────────────────────── */
function CodeWindow() {
  return (
    <div
      className="rounded-xl overflow-hidden text-left"
      style={{
        background: 'var(--wlc-code-bg)',
        border: '1px solid var(--wlc-code-border)',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '12px',
        lineHeight: '1.7',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: 'var(--wlc-code-chrome)', borderBottom: '1px solid var(--wlc-code-chrome-border)' }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-2 text-xs" style={{ color: 'var(--wlc-code-tab)' }}>solution.py</span>
      </div>
      <div className="p-4 space-y-0.5">
        <div>
          <span style={{ color: 'var(--wlc-code-kw)' }}>def </span>
          <span style={{ color: 'var(--wlc-code-fn)' }}>binary_search</span>
          <span style={{ color: 'var(--wlc-code-text)' }}>(arr, target):</span>
        </div>
        <div className="pl-4">
          <span style={{ color: 'var(--wlc-code-text)' }}>lo, hi = </span>
          <span style={{ color: 'var(--wlc-code-num)' }}>0</span>
          <span style={{ color: 'var(--wlc-code-text)' }}>, </span>
          <span style={{ color: 'var(--wlc-code-num)' }}>len</span>
          <span style={{ color: 'var(--wlc-code-text)' }}>(arr) - </span>
          <span style={{ color: 'var(--wlc-code-num)' }}>1</span>
        </div>
        <div className="pl-4">
          <span style={{ color: 'var(--wlc-code-kw)' }}>while </span>
          <span style={{ color: 'var(--wlc-code-text)' }}>lo &lt;= hi:</span>
        </div>
        <div className="pl-8">
          <span style={{ color: 'var(--wlc-code-text)' }}>mid = (lo + hi) // </span>
          <span style={{ color: 'var(--wlc-code-num)' }}>2</span>
        </div>
        <div className="pl-8">
          <span style={{ color: 'var(--wlc-code-kw)' }}>if </span>
          <span style={{ color: 'var(--wlc-code-text)' }}>arr[mid] == target:</span>
        </div>
        <div className="pl-12">
          <span style={{ color: 'var(--wlc-code-kw)' }}>return </span>
          <span style={{ color: 'var(--wlc-code-text)' }}>mid</span>
        </div>
        <div className="pl-4 mt-1" style={{ color: 'var(--wlc-code-comment)' }}>
          # ✓ Все тесты пройдены!
        </div>
      </div>
    </div>
  )
}

/* ─── Hero dashboard illustration ───────────────────── */
function HeroIllustration() {
  const skills = [
    { label: 'Python', pct: 78, color: '#6366f1' },
    { label: 'React', pct: 55, color: '#06b6d4' },
    { label: 'SQL', pct: 90, color: '#8b5cf6' },
  ]
  const achievements = [
    { icon: '🏆', text: 'Топ 5% группы', color: '#f59e0b' },
    { icon: '🔥', text: 'Стрик 21 день', color: '#ef4444' },
    { icon: '✅', text: '47 задач решено', color: '#10b981' },
    { icon: '📚', text: '12 лекций пройдено', color: '#6366f1' },
  ]

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-6 p-6 sm:p-8">
      {/* Student card */}
      <div
        className="flex flex-col gap-5 p-5 rounded-2xl lg:w-52 shrink-0"
        style={{
          background: 'var(--wlc-hero-card-bg)',
          border: 'var(--wlc-hero-card-border)',
          boxShadow: 'var(--wlc-hero-card-shadow)',
        }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
                border: '2px solid rgba(99,102,241,0.3)',
              }}
            >
              👩‍💻
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#10b981', border: '2px solid var(--wlc-hero-online-border)' }}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--wlc-hero-name)' }}>
              Айгерим, 19 лет
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--wlc-hero-sub)' }}>
              Студентка · 2-й курс
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {skills.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--wlc-hero-label)' }}>{s.label}</span>
                <span style={{ color: s.color }}>{s.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--wlc-hero-track)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        <CodeWindow />

        {/* Achievements */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--wlc-hero-card-bg)',
            border: 'var(--wlc-hero-card-border)',
            boxShadow: 'var(--wlc-hero-card-shadow)',
          }}
        >
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--wlc-hero-sub)' }}>
            ДОСТИЖЕНИЯ
          </div>
          <div className="space-y-2.5">
            {achievements.map((a) => (
              <div key={a.text} className="flex items-center gap-2.5">
                <span className="text-base leading-none">{a.icon}</span>
                <span className="text-sm font-medium" style={{ color: a.color }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming lesson */}
        <div
          className="sm:col-span-2 rounded-xl p-4 flex items-center gap-4"
          style={{
            background: 'var(--wlc-hero-lesson-bg)',
            border: '1px solid var(--wlc-hero-lesson-border)',
            boxShadow: 'var(--wlc-hero-card-shadow)',
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)' }}
          >
            📡
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--wlc-hero-name)' }}>
              Следующий урок: Алгоритмы и структуры данных
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--wlc-hero-sub)' }}>
              Сегодня в 18:00 · Лекция + Практика
            </div>
          </div>
          <div
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--wlc-hero-connect-color)' }}
          >
            Подключиться
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main landing page ──────────────────────────────── */
export const Welcome = () => {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'var(--wlc-bg)' }}
    >
      {/* ── Background grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--wlc-grid-color) 1px, transparent 1px),
                            linear-gradient(90deg, var(--wlc-grid-color) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* ── Ambient glow orbs ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '30%', width: '560px', height: '560px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40%', right: '-5%', width: '440px', height: '440px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '10%', left: '5%', width: '380px', height: '380px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <HeaderWelcome />

      {/* ══════════════════ HERO ══════════════════ */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 text-center pt-32 pb-12">
        {/* Live badge */}
        <div
          className="mb-7 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium"
          style={{
            background: 'var(--wlc-badge-bg)',
            borderColor: 'var(--wlc-badge-border)',
            color: 'var(--wlc-badge-color)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#00f5ff' }} />
          Приём заявок открыт — Осенний набор 2025
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.08] mb-6 max-w-5xl"
          style={{
            background: 'linear-gradient(135deg, var(--wlc-h1-from) 0%, var(--wlc-h1-via) 38%, var(--wlc-h1-to) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Стань IT-специалистом,
          <br />
          не выходя из дома
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg sm:text-xl mb-10 max-w-2xl leading-relaxed"
          style={{ color: 'var(--wlc-text-secondary)' }}
        >
          Обучение онлайн&nbsp;&nbsp;•&nbsp;&nbsp;Практика с реальными
          проектами&nbsp;&nbsp;•&nbsp;&nbsp;Помощь с трудоустройством
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/register"
            className="px-9 py-4 rounded-xl font-bold text-[17px] text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #06b6d4 100%)',
              boxShadow: 'var(--wlc-cta-shadow)',
            }}
          >
            Поступить в колледж
          </Link>
          <Link
            href="/login"
            className="px-9 py-4 rounded-xl font-bold text-[17px] border transition-all duration-200 hover:scale-105"
            style={{
              borderColor: 'var(--wlc-ghost-border)',
              color: 'var(--wlc-ghost-color)',
              background: 'var(--wlc-ghost-bg)',
            }}
          >
            Войти в личный кабинет →
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div
          className="w-full max-w-5xl rounded-2xl overflow-hidden"
          style={{
            background: 'var(--wlc-mockup-bg)',
            border: '1px solid var(--wlc-mockup-border)',
            boxShadow: 'var(--wlc-mockup-shadow)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <HeroIllustration />
        </div>
      </main>

      {/* ══════════════════ STATS ══════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: '2 000+', label: 'Студентов обучается' },
            { value: '98%', label: 'Довольны качеством' },
            { value: '150+', label: 'Трудоустроено' },
            { value: '12', label: 'IT-специальностей' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-6 rounded-2xl"
              style={{
                background: 'var(--wlc-card-bg)',
                border: 'var(--wlc-card-border)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--wlc-card-shadow)',
              }}
            >
              <div
                className="text-3xl sm:text-4xl font-black mb-1"
                style={{
                  background: 'linear-gradient(135deg, var(--wlc-stat-from), var(--wlc-stat-to))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--wlc-text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-black mb-3"
            style={{ color: 'var(--wlc-text-primary)' }}
          >
            Почему выбирают нас
          </h2>
          <p style={{ color: 'var(--wlc-text-muted)' }}>
            Всё необходимое для успешного старта в IT
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl transition-transform duration-300 hover:-translate-y-1.5"
              style={{
                background: 'var(--wlc-card-bg)',
                border: 'var(--wlc-card-border)',
                backdropFilter: 'blur(12px)',
                boxShadow: 'var(--wlc-card-shadow)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}15`, border: `1px solid ${f.color}30`, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold mb-2 text-[15px]" style={{ color: 'var(--wlc-text-primary)' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--wlc-text-muted)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ BOTTOM CTA ══════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div
          className="relative rounded-3xl p-10 sm:p-16 text-center overflow-hidden"
          style={{
            background: 'var(--wlc-cta-section-bg)',
            border: '1px solid var(--wlc-cta-section-border)',
            boxShadow: 'var(--wlc-cta-section-shadow)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 65%)' }}
          />
          <h2 className="relative text-3xl sm:text-4xl font-black mb-4" style={{ color: 'var(--wlc-text-primary)' }}>
            Готов начать своё IT-будущее?
          </h2>
          <p className="relative text-lg mb-8" style={{ color: 'var(--wlc-text-secondary)' }}>
            Первый шаг — подать заявку. Это бесплатно и займёт 2 минуты.
          </p>
          <Link
            href="/register"
            className="relative inline-block px-10 py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
              boxShadow: 'var(--wlc-cta-glow)',
            }}
          >
            Начать обучение бесплатно →
          </Link>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer
        className="relative z-10 border-t py-8 text-center"
        style={{ borderColor: 'var(--wlc-footer-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--wlc-footer-text)' }}>
          © 2025 IT-Колледж. Онлайн-образование будущего.
        </p>
      </footer>
    </div>
  )
}
