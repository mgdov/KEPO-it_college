"use client"

import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Clock, FileText, Lock, ChevronLeft, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LessonTypeBadge } from "../../page"
import { AssessmentModule } from "@/components/lesson/assessment-module"
import { GameModule } from "@/components/lesson/game-module"
import { CodeModule } from "@/components/lesson/code-module"

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>()
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ["student", "lesson", params.lessonId],
    queryFn: () => student.lesson(params.lessonId),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (error || !lesson) {
    const msg = (error as { status?: number })?.status === 403
      ? "Это занятие не входит в вашу группу или недоступно."
      : "Занятие не найдено."
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{msg}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/student/schedule"><ChevronLeft className="h-4 w-4 mr-1" />К расписанию</Link>
        </Button>
      </div>
    )
  }

  const now = new Date()
  const isLocked = lesson.isLocked && !lesson.isUnlocked
  const isPast = new Date(lesson.endsAt) < now
  const isCurrent = new Date(lesson.startsAt) <= now && new Date(lesson.endsAt) >= now

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link href="/student/schedule">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Расписание
        </Link>
      </Button>

      {/* Header */}
      <Card className={isLocked ? "opacity-60" : ""}>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <LessonTypeBadge type={lesson.lessonType} />
                {isCurrent && (
                  <Badge className="bg-green-500/20 text-green-600 border-0 animate-pulse">
                    Идёт сейчас
                  </Badge>
                )}
                {isPast && !isCurrent && (
                  <Badge variant="outline" className="text-muted-foreground">Завершено</Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Заблокировано
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground">{lesson.subject.name}</h2>
              <p className="text-sm text-muted-foreground">Код предмета: {lesson.subject.code}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(lesson.startsAt), "d MMM, HH:mm", { locale: ru })} –{" "}
                {format(new Date(lesson.endsAt), "HH:mm")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLocked ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="font-semibold text-foreground">Занятие заблокировано</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Занятие завершилось или ещё не открыто. Обратитесь к администратору для разблокировки.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* LECTURE – materials */}
          {lesson.lessonType === "LECTURE" && (
            <MaterialsSection lessonId={params.lessonId} materials={lesson.materials} />
          )}

          {/* LAB GAME */}
          {lesson.lessonType === "LAB_GAME" && lesson.gameType && (
            <GameModule lessonId={params.lessonId} gameType={lesson.gameType} />
          )}

          {/* LAB CODE */}
          {lesson.lessonType === "LAB_CODE" && (
            <CodeModule lessonId={params.lessonId} />
          )}

          {/* LAB TASK / EXAM – assessment */}
          {(lesson.lessonType === "LAB_TASK" || lesson.lessonType === "EXAM") && (
            <>
              {lesson.materials.length > 0 && (
                <MaterialsSection lessonId={params.lessonId} materials={lesson.materials} />
              )}
              {lesson.assessment && (
                <AssessmentModule lessonId={params.lessonId} assessment={lesson.assessment} />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function MaterialsSection({
  lessonId,
  materials,
}: {
  lessonId: string
  materials: { id: string; title: string; description?: string; fileName: string; fileType: string }[]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Материалы занятия
        </CardTitle>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Материалы ещё не добавлены
          </p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground uppercase">{m.fileType}</p>
                  </div>
                </div>
                <a
                  href={`/api/student/lessons/${lessonId}/materials/${m.id}/download`}
                  download
                  className="flex-shrink-0"
                >
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Скачать
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
