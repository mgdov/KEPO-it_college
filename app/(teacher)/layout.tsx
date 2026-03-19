"use client"

import { useMe } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  LayoutDashboard, CalendarDays, Users, BookOpen, ClipboardList, BarChart2
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/shell"
import type { NavItem } from "@/components/dashboard/sidebar"

const navItems: NavItem[] = [
  { href: "/teacher", label: "Главная", icon: LayoutDashboard },
  { href: "/teacher/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/groups", label: "Группы", icon: Users },
  { href: "/teacher/lessons", label: "Занятия", icon: BookOpen },
  { href: "/teacher/assessments", label: "Тесты", icon: ClipboardList },
  { href: "/teacher/results", label: "Результаты", icon: BarChart2 },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, error } = useMe()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (error || !me)) router.push("/login")
    if (!isLoading && me && me.role !== "TEACHER" && me.role !== "ADMIN") {
      if (me.role === "STUDENT") router.push("/student")
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
      role="teacher"
      title="Кабинет преподавателя"
      userName={me.fullName}
    >
      {children}
    </DashboardShell>
  )
}
