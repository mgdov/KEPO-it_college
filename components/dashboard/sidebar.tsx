"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UniversityLogo } from "@/components/university-logo"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
}

interface SidebarProps {
  items: NavItem[]
  role: "student" | "teacher" | "admin"
  userName?: string
}

const roleLabels = {
  student: "Студент",
  teacher: "Преподаватель",
  admin: "Администратор",
}

const roleColors = {
  student: "bg-blue-500/20 text-blue-200",
  teacher: "bg-emerald-500/20 text-emerald-200",
  admin: "bg-amber-500/20 text-amber-200",
}

export function Sidebar({ items, role, userName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full bg-sidebar text-sidebar-foreground w-64 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <UniversityLogo className="h-9 w-9 text-sidebar-foreground" />
        <div className="min-w-0">
          <p className="font-bold text-sm text-sidebar-foreground leading-tight">КЭПО</p>
          <p className="text-xs text-sidebar-foreground/60 leading-tight truncate">
            Образовательная платформа
          </p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", roleColors[role])}>
          {roleLabels[role]}
        </div>
        {userName && (
          <p className="mt-1 text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-sidebar-primary" : "")} />
              <span className="truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-sidebar-foreground/40">
        © {new Date().getFullYear()} КЭПО
      </div>
    </aside>
  )
}
