"use client"

import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

function getGrade(pct: number) {
  if (pct >= 90) return { label: "Отлично", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" }
  if (pct >= 75) return { label: "Хорошо", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" }
  if (pct >= 60) return { label: "Удовл.", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" }
  return { label: "Неудовл.", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" }
}

export default function GradesPage() {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["student", "grades"],
    queryFn: student.grades,
  })

  const totalScore = grades.reduce((s, g) => s + g.score, 0)
  const totalMax = grades.reduce((s, g) => s + g.maxScore, 0)
  const performance = totalMax ? Math.round((totalScore / totalMax) * 100) : 0

  const bySubject = Object.entries(
    grades.reduce<Record<string, typeof grades>>((acc, g) => {
      acc[g.subjectName] = acc[g.subjectName] ?? []
      acc[g.subjectName].push(g)
      return acc
    }, {})
  ).map(([subject, gs]) => {
    const total = gs.reduce((s, g) => s + g.maxScore, 0)
    const got = gs.reduce((s, g) => s + g.score, 0)
    return { subject, grades: gs, pct: total ? Math.round((got / total) * 100) : 0, got, total }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Успеваемость</h2>

      {/* Overall */}
      <Card className="border-primary/30">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Общая успеваемость</p>
              <p className="text-4xl font-bold text-foreground">{performance}%</p>
              <Progress value={performance} className="h-2 mt-2 max-w-xs" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalScore}</p>
              <p className="text-xs text-muted-foreground">из {totalMax} баллов</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By subject */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : bySubject.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Оценок пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bySubject.map(({ subject, grades: sGrades, pct, got, total }) => {
            const grade = getGrade(pct)
            return (
              <Card key={subject}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">{subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${grade.color}`}>
                      {grade.label}
                    </span>
                    <span className="font-bold text-foreground">{pct}%</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={pct} className="h-1.5 mb-3" />
                  <div className="space-y-1">
                    {sGrades.map((g, i) => {
                      const pctItem = g.maxScore ? Math.round((g.score / g.maxScore) * 100) : 0
                      return (
                        <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                          <span className="text-muted-foreground truncate flex-1 mr-4">
                            {g.lessonTitle}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(g.gradedAt), "d MMM", { locale: ru })}
                            </span>
                            {pctItem >= 80 ? (
                              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            ) : pctItem >= 60 ? (
                              <Minus className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span className="font-semibold text-foreground w-12 text-right">
                              {g.score}/{g.maxScore}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      Итого: {got}/{total} баллов
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
