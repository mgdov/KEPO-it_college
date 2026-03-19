"use client"

import { useMe } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  CalendarDays, ClipboardList, BarChart2, FileText, Shield
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/shell"
import type { NavItem } from "@/components/dashboard/sidebar"

const navItems: NavItem[] = [
  { href: "/admin", label: "Панель управления", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/groups", label: "Группы", icon: GraduationCap },
  { href: "/admin/subjects", label: "Предметы", icon: BookOpen },
  { href: "/admin/lessons", label: "Занятия", icon: CalendarDays },
  { href: "/admin/assessments", label: "Тесты", icon: ClipboardList },
  { href: "/admin/results", label: "Результаты", icon: BarChart2 },
  { href: "/admin/audit", label: "Журнал аудита", icon: FileText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, error } = useMe()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (error || !me)) router.push("/login")
    if (!isLoading && me && me.role !== "ADMIN") {
      if (me.role === "STUDENT") router.push("/student")
      else if (me.role === "TEACHER") router.push("/teacher")
    }
  }, [me, isLoading, error, router])

  if (isLoading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell
      navItems={navItems}
      role="admin"
      title="Панель администратора"
      userName={me.fullName}
    >
      {children}
    </DashboardShell>
  )
}
