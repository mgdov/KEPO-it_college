"use client"

import { useQuery } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import Link from "next/link"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Users, GraduationCap, BookOpen, CalendarDays,
  ClipboardList, ChevronRight, UserCheck, Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminHomePage() {
  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => admin.users(),
  })
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["admin", "users", "PENDING"],
    queryFn: () => admin.users("PENDING"),
  })
  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: admin.groups,
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: admin.subjects,
  })
  const { data: lessons = [] } = useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: () => admin.lessons(),
  })
  const { data: assessments = [] } = useQuery({
    queryKey: ["admin", "assessments"],
    queryFn: () => admin.assessments(),
  })

  const now = new Date()
  const recentLessons = lessons
    .filter((l) => new Date(l.startsAt) >= now)
    .slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="rounded-xl bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-primary-foreground/70 text-sm">
            {format(now, "EEEE, d MMMM yyyy", { locale: ru })}
          </p>
          <h2 className="text-2xl font-bold">Панель администратора</h2>
          <p className="text-sm text-primary-foreground/80">Управление образовательной платформой КЭПО</p>
        </div>
        {pendingUsers.length > 0 && (
          <Button asChild className="bg-white text-primary hover:bg-white/90 font-bold flex-shrink-0">
            <Link href="/admin/users">
              <UserCheck className="h-4 w-4 mr-2" />
              {pendingUsers.length} на рассмотрении
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard href="/admin/users" icon={Users} label="Пользователей" value={String(allUsers.length)} sub={`${pendingUsers.length} ожидают`} alert={pendingUsers.length > 0} />
        <StatCard href="/admin/groups" icon={GraduationCap} label="Групп" value={String(groups.length)} sub="учебных групп" />
        <StatCard href="/admin/subjects" icon={BookOpen} label="Предметов" value={String(subjects.length)} sub="дисциплин" />
        <StatCard href="/admin/lessons" icon={CalendarDays} label="Занятий" value={String(lessons.length)} sub="всего" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Ожидают подтверждения
              {pendingUsers.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-600 border-0">{pendingUsers.length}</Badge>
              )}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-auto py-1">
              <Link href="/admin/users" className="flex items-center gap-1">
                Все <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Нет ожидающих подтверждения
              </p>
            ) : (
              <div className="space-y-2">
                {pendingUsers.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {u.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">PENDING</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Предстоящие занятия
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-auto py-1">
              <Link href="/admin/lessons" className="flex items-center gap-1">
                Все <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Нет предстоящих занятий
              </p>
            ) : (
              <div className="space-y-2">
                {recentLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground w-16 flex-shrink-0">
                      <div className="font-medium text-foreground">{format(new Date(lesson.startsAt), "d MMM", { locale: ru })}</div>
                      <div>{format(new Date(lesson.startsAt), "HH:mm")}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lesson.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{lesson.group.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink href="/admin/users" icon={Users} label="Управление пользователями" />
        <QuickLink href="/admin/groups" icon={GraduationCap} label="Управление группами" />
        <QuickLink href="/admin/subjects" icon={BookOpen} label="Управление предметами" />
        <QuickLink href="/admin/assessments" icon={ClipboardList} label="Тесты и задания" />
      </div>
    </div>
  )
}

function StatCard({
  href,
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  href: string
  icon: typeof Users
  label: string
  value: string
  sub: string
  alert?: boolean
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${alert ? "bg-amber-500/20" : "bg-primary/10"}`}>
              <Icon className={`h-5 w-5 ${alert ? "text-amber-600" : "text-primary"}`} />
            </div>
            {alert && (
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className={`text-xs mt-0.5 ${alert ? "text-amber-600 font-medium" : "text-muted-foreground/60"}`}>{sub}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof Users
  label: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground leading-snug">{label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}
