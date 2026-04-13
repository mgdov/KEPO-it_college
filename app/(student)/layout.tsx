"use client"

import { useMe } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Trophy,
  CreditCard,
  User,
  Dumbbell,
  Newspaper,
  Library,
  Landmark,
  FolderOpen,
  FileText,
  Briefcase,
  Settings,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/shell"
import type { NavItem } from "@/components/dashboard/sidebar"

const navItems: NavItem[] = [
  { href: "/student", label: "Главная", icon: LayoutDashboard },
  { href: "/student/announcements", label: "Доска объявлений", icon: Newspaper, badge: 27 },
  { href: "/student/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/courses", label: "Мои курсы", icon: BookOpen },
  { href: "/student/portfolio", label: "Портфолио", icon: Briefcase },
  { href: "/student/resources", label: "Библиотека и ресурсы", icon: Library },
  { href: "/student/extracurricular", label: "Внеучебная работа", icon: Landmark },
  { href: "/student/documents", label: "Документы и бланки", icon: FolderOpen },
  { href: "/student/requests", label: "Справки и заявления", icon: FileText },
  { href: "/physical-education", label: "Физкультура", icon: Dumbbell },
  { href: "/student/grades", label: "Успеваемость", icon: Trophy },
  { href: "/student/settings", label: "Настройки", icon: Settings },
  { href: "/student/profile", label: "Профиль", icon: User },
  { href: "/payment", label: "Оплата обучения", icon: CreditCard },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, error } = useMe()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (error || !me)) router.push("/login")
    if (!isLoading && me && me.role !== "STUDENT") {
      if (me.role === "ADMIN") router.push("/admin")
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
      role="student"
      title="Личный кабинет студента"
      userName={me.fullName}
    >
      {children}
    </DashboardShell>
  )
}
