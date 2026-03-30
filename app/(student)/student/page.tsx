"use client"

import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import { useMe } from "@/lib/hooks/use-auth"
import Link from "next/link"
import {
  BookOpen, CalendarDays, Trophy, TrendingUp,
  PlayCircle, GraduationCap, Clock, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { ru } from "date-fns/locale"

function calcPerformance(grades: { score: number; maxScore: number }[]) {
  if (!grades.length) return 0
  const total = grades.reduce((s, g) => s + g.maxScore, 0)
  const got = grades.reduce((s, g) => s + g.score, 0)
  return total ? Math.round((got / total) * 100) : 0
}

function getPerformanceColor(pct: number) {
  if (pct >= 80) return "text-green-600 dark:text-green-400"
  if (pct >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

export default function StudentHomePage() {
  const { data: me } = useMe()
  const { data: profile } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: student.profile,
  })
  const { data: grades = [] } = useQuery({
    queryKey: ["student", "grades"],
    queryFn: student.grades,
  })

  const now = new Date()
  const weekFrom = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
  const weekTo = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")

  const { data: schedule = [] } = useQuery({
    queryKey: ["student", "schedule", weekFrom, weekTo],
    queryFn: () => student.schedule(weekFrom, weekTo),
  })

  const performance = calcPerformance(grades)
  const today = format(now, "yyyy-MM-dd")
  const todayLessons = schedule.filter((l) => l.startsAt.startsWith(today))
  const nextLesson = todayLessons.find((l) => new Date(l.startsAt) > now) ?? todayLessons[0]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-primary-foreground/70 text-sm">
            {format(now, "EEEE, d MMMM yyyy", { locale: ru })}
          </p>
          <h2 className="text-2xl font-bold text-balance">
            Добро пожаловать, {me?.fullName?.split(" ")[1] ?? me?.fullName}!
          </h2>
          {profile?.student?.group && (
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
              <GraduationCap className="h-4 w-4" />
              <span>
                {profile.student.group.specialty} · {profile.student.group.name} · {profile.student.group.course} курс
              </span>
            </div>
          )}
        </div>
        <Button
          asChild
          size="lg"
          className="bg-white text-primary hover:bg-white/90 font-bold whitespace-nowrap shadow-lg flex-shrink-0"
        >
          <Link href="/courses">
            <PlayCircle className="h-5 w-5 mr-2" />
            Начать учёбу
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Успеваемость"
          value={`${performance}%`}
          valueClass={getPerformanceColor(performance)}
          sub={grades.length ? `${grades.length} оценок` : "Оценок нет"}
        />
        <StatCard
          icon={CalendarDays}
          label="Занятий на неделе"
          value={String(schedule.length)}
          sub="в текущей неделе"
        />
        <StatCard
          icon={BookOpen}
          label="Сегодня занятий"
          value={String(todayLessons.length)}
          sub={todayLessons.length ? "по расписанию" : "Занятий нет"}
        />
        <StatCard
          icon={TrendingUp}
          label="Предметов"
          value={String(new Set(grades.map((g) => g.subjectName)).size)}
          sub="в этом семестре"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Расписание на сегодня
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-auto py-1">
              <Link href="/student/schedule" className="flex items-center gap-1">
                Все <ChevronRight className="h-3 w-3" />
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
                {todayLessons.slice(0, 4).map((lesson) => {
                  const isPast = new Date(lesson.endsAt) < now
                  const isCurrent =
                    new Date(lesson.startsAt) <= now && new Date(lesson.endsAt) >= now
                  return (
                    <Link
                      key={lesson.id}
                      href={`/student/lessons/${lesson.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex flex-col items-center text-xs text-muted-foreground w-14 flex-shrink-0">
                        <span>{format(new Date(lesson.startsAt), "HH:mm")}</span>
                        <span>–</span>
                        <span>{format(new Date(lesson.endsAt), "HH:mm")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lesson.subject.name}</p>
                        <LessonTypeBadge type={lesson.lessonType} />
                      </div>
                      {isCurrent && (
                        <Badge className="bg-green-500/20 text-green-600 border-0 text-xs">Идёт</Badge>
                      )}
                      {isPast && !isCurrent && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Прошло</Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Успеваемость
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-primary h-auto py-1">
              <Link href="/student/grades" className="flex items-center gap-1">
                Подробнее <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-bold ${getPerformanceColor(performance)}`}>
                {performance}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">общая успеваемость</span>
            </div>
            <Progress value={performance} className="h-2" />

            {/* Recent grades */}
            <div className="space-y-2 mt-3">
              {grades.slice(0, 4).map((g, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[180px]">{g.subjectName}</span>
                  <span
                    className={`font-semibold ${g.score / g.maxScore >= 0.8
                        ? "text-green-600 dark:text-green-400"
                        : g.score / g.maxScore >= 0.6
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    {g.score}/{g.maxScore}
                  </span>
                </div>
              ))}
              {grades.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Оценок пока нет
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next lesson */}
      {nextLesson && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Следующее занятие</p>
                  <p className="font-semibold text-foreground">{nextLesson.subject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(nextLesson.startsAt), "HH:mm")} –{" "}
                    {format(new Date(nextLesson.endsAt), "HH:mm")}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" disabled={nextLesson.isLocked}>
                <Link href={`/student/lessons/${nextLesson.id}`}>
                  Перейти
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: typeof BookOpen
  label: string
  value: string
  sub: string
  valueClass?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold ${valueClass ?? "text-foreground"}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function LessonTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    LECTURE: { label: "ЛК", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    LAB_QUIZ: { label: "ЛЗ-Тест", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    LAB_MATH: { label: "ЛЗ-Мат.", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
    LAB_PROGRAMMING: { label: "ЛЗ-Код", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    LAB_GAME: { label: "ЛЗ-Игра", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    EXAM: { label: "Экзамен", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    CREDIT: { label: "Зачёт", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  }
  const { label, className } = map[type] ?? { label: type, className: "" }
  return (
    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${className}`}>
      {label}
    </span>
  )
}
