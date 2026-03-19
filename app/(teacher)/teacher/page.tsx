"use client"

import { useQuery } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import { useMe } from "@/lib/hooks/use-auth"
import Link from "next/link"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Users, BookOpen, ClipboardList, BarChart2,
  ChevronRight, CalendarDays, Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LessonTypeBadge } from "@/app/(student)/student/page"

export default function TeacherHomePage() {
  const { data: me } = useMe()
  const now = new Date()
  const weekFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
  const weekTo = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["admin", "lessons", weekFrom, weekTo],
    queryFn: () => admin.lessons({ from: weekFrom, to: weekTo }),
  })
  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: admin.groups,
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: admin.subjects,
  })
  const { data: assessments = [] } = useQuery({
    queryKey: ["admin", "assessments"],
    queryFn: () => admin.assessments(),
  })

  const today = format(now, "yyyy-MM-dd")
  const todayLessons = lessons.filter((l) => l.startsAt.startsWith(today))
  const upcomingLessons = lessons
    .filter((l) => new Date(l.startsAt) > now)
    .slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-primary-foreground/70 text-sm">
            {format(now, "EEEE, d MMMM yyyy", { locale: ru })}
          </p>
          <h2 className="text-2xl font-bold text-balance">
            Добро пожаловать, {me?.fullName?.split(" ")[0] ?? "Преподаватель"}!
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Кабинет преподавателя
          </p>
        </div>
        <Button asChild className="bg-white text-primary hover:bg-white/90 font-bold flex-shrink-0">
          <Link href="/teacher/lessons">
            <BookOpen className="h-4 w-4 mr-2" />
            Управление занятиями
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Занятий сегодня" value={String(todayLessons.length)} sub="по расписанию" />
        <StatCard icon={BookOpen} label="Занятий на неделе" value={String(lessons.length)} sub="текущая неделя" />
        <StatCard icon={Users} label="Групп" value={String(groups.length)} sub="всего" />
        <StatCard icon={ClipboardList} label="Тестов" value={String(assessments.length)} sub="создано" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Сегодня
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-auto py-1">
              <Link href="/teacher/schedule" className="flex items-center gap-1">
                Расписание <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayLessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Сегодня занятий нет
              </div>
            ) : (
              <div className="space-y-2">
                {todayLessons.map((lesson) => {
                  const isCurrent =
                    new Date(lesson.startsAt) <= now && new Date(lesson.endsAt) >= now
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border"
                    >
                      <div className="flex flex-col items-center text-xs text-muted-foreground w-14 flex-shrink-0">
                        <span>{format(new Date(lesson.startsAt), "HH:mm")}</span>
                        <span>–</span>
                        <span>{format(new Date(lesson.endsAt), "HH:mm")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lesson.subject.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <LessonTypeBadge type={lesson.lessonType} />
                          <span className="text-xs text-muted-foreground">{lesson.group.name}</span>
                        </div>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-green-500/20 text-green-600 border-0 text-xs">Идёт</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Ближайшие занятия
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-auto py-1">
              <Link href="/teacher/lessons" className="flex items-center gap-1">
                Все <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingLessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Нет предстоящих занятий
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <div className="flex flex-col items-center text-xs text-muted-foreground w-20 flex-shrink-0">
                      <span className="font-medium text-foreground">
                        {format(new Date(lesson.startsAt), "d MMM", { locale: ru })}
                      </span>
                      <span>{format(new Date(lesson.startsAt), "HH:mm")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lesson.subject.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <LessonTypeBadge type={lesson.lessonType} />
                        <span className="text-xs text-muted-foreground">{lesson.group.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick access cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickCard
          href="/groups"
          icon={Users}
          title="Группы"
          description={`${groups.length} групп`}
        />
        <QuickCard
          href="/teacher/assessments"
          icon={ClipboardList}
          title="Тесты и задания"
          description={`${assessments.length} тестов`}
        />
        <QuickCard
          href="/teacher/results"
          icon={BarChart2}
          title="Результаты"
          description="Статистика студентов"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof BookOpen
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        <p className="text-xs text-muted-foreground/60">{sub}</p>
      </CardContent>
    </Card>
  )
}

function QuickCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof Users
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardContent>
      </Card>
    </Link>
  )
}
