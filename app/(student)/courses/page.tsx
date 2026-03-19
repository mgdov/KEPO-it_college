"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CourseCard {
  id: string
  title: string
  description: string
  progress: number
  lessons: number
  average: string
}

function toPercent(sum: number, max: number) {
  if (!max) return 0
  return Math.round((sum / max) * 100)
}

export default function StudentCoursesPage() {
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["student", "profile"],
    // TODO: connect to real API endpoint /api/student/profile
    queryFn: student.profile,
  })

  const {
    data: grades = [],
    isLoading: gradesLoading,
    error: gradesError,
  } = useQuery({
    queryKey: ["student", "grades"],
    // TODO: connect to real API endpoint /api/student/grades
    queryFn: student.grades,
  })

  const cards = useMemo<CourseCard[]>(() => {
    const subjectMap = new Map<string, { total: number; max: number; lessons: number }>()

    for (const grade of grades) {
      const current = subjectMap.get(grade.subjectName) ?? { total: 0, max: 0, lessons: 0 }
      subjectMap.set(grade.subjectName, {
        total: current.total + grade.score,
        max: current.max + grade.maxScore,
        lessons: current.lessons + 1,
      })
    }

    const subjectCards = [...subjectMap.entries()].map(([subject, meta]) => {
      const progress = toPercent(meta.total, meta.max)
      return {
        id: `subject-${subject}`,
        title: subject,
        description: "Предмет в вашем учебном плане",
        progress,
        lessons: meta.lessons,
        average: `${meta.total}/${meta.max}`,
      }
    })

    const programTotal = grades.reduce((acc, item) => acc + item.score, 0)
    const programMax = grades.reduce((acc, item) => acc + item.maxScore, 0)

    const programCard: CourseCard | null = profile?.student?.group
      ? {
        id: `program-${profile.student.group.id}`,
        title: profile.student.group.specialty,
        description: `${profile.student.group.name} · ${profile.student.group.course} курс`,
        progress: toPercent(programTotal, programMax),
        lessons: grades.length,
        average: `${programTotal}/${programMax}`,
      }
      : null

    return (programCard ? [programCard] : []).concat(subjectCards)
  }, [grades, profile])

  if (profileLoading || gradesLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (profileError || gradesError) {
    return (
      <Card className="max-w-3xl mx-auto border-red-300">
        <CardContent className="py-10 text-center space-y-2">
          <p className="text-lg font-semibold">Не удалось загрузить курсы</p>
          <p className="text-sm text-muted-foreground">
            Попробуйте обновить страницу или повторите позже.
          </p>
          <Button asChild variant="outline">
            <Link href="/student/schedule">Перейти к расписанию</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="overflow-hidden border-[#0033A0]/20">
        <CardContent className="bg-linear-to-r from-[#0033A0] to-[#1147b8] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Личный кабинет студента</p>
              <h1 className="text-2xl font-bold">Мои курсы</h1>
              <p className="text-sm text-white/80">
                Все специальности и предметы из профиля и группы с прогрессом по оценкам.
              </p>
            </div>
            {profile?.student?.group ? (
              <Badge className="bg-white text-[#0033A0] hover:bg-white/90">
                <GraduationCap className="mr-1 h-4 w-4" />
                {profile.student.group.name}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.id} className="border-[#0033A0]/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0]">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="line-clamp-2">{card.title}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Прогресс</span>
                  <span className="font-semibold text-[#0033A0]">{card.progress}%</span>
                </div>
                <Progress value={card.progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Оценки</span>
                <span className="font-medium text-foreground">{card.average}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Кол-во занятий</span>
                <span className="font-medium text-foreground">{card.lessons}</span>
              </div>

              <Button asChild className="w-full bg-[#0033A0] hover:bg-[#002A84]">
                <Link href="/student/schedule">
                  Перейти к занятиям
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
