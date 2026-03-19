import type { Metadata } from "next"
import { UniversityLogo } from "@/components/university-logo"

export const metadata: Metadata = {
  title: "Вход — КЭПО",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <UniversityLogo className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">КЭПО</span>
            <span className="text-xs text-primary-foreground/70 leading-tight">
              Образовательная платформа
            </span>
          </div>
        </div>
      </header>

      {/* Blue accent stripe */}
      <div className="h-1 bg-gradient-to-r from-primary via-blue-400 to-cyan-400" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} КЭПО — Все права защищены
      </footer>
    </div>
  )
}
