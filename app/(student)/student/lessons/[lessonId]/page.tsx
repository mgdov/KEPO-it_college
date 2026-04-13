"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { student, apiUrl } from "@/lib/api"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Clock, FileText, Lock, ChevronLeft, Eye, Loader2, ClipboardList, CheckCircle } from "lucide-react"
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

          {/* LAB CODE (programming) */}
          {lesson.lessonType === "LAB_PROGRAMMING" && (
            <CodeModule lessonId={params.lessonId} />
          )}

          {/* LAB QUIZ / LAB MATH / EXAM / CREDIT – assessment + pool variant */}
          {(lesson.lessonType === "LAB_QUIZ" || lesson.lessonType === "LAB_MATH" || lesson.lessonType === "EXAM" || lesson.lessonType === "CREDIT") && (
            <>
              {lesson.materials.length > 0 && (
                <MaterialsSection lessonId={params.lessonId} materials={lesson.materials} />
              )}
              <PoolVariantSection lessonId={params.lessonId} />
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
                  href={apiUrl(`/api/student/lessons/${lessonId}/materials/${m.id}/view`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0"
                >
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Открыть
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

// ─── Pool Variant Section ────────────────────────────────────────────────────

function PoolVariantSection({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ["student", "pool-variant", lessonId],
    queryFn: () => student.getPoolVariant(lessonId),
    retry: false,
  })

  const assignMutation = useMutation({
    mutationFn: () => student.assignPoolVariant(lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "pool-variant", lessonId] })
    },
  })

  const hasVariant = data?.success && data.assignment
  const is404 = (error as { status?: number })?.status === 404

  // Loading
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // No pool linked — silently skip (assessment module will handle the lesson)
  if (is404 && !assignMutation.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <ClipboardList className="h-10 w-10 text-primary mx-auto" />
          <div>
            <p className="font-semibold text-foreground">Индивидуальный вариант</p>
            <p className="text-sm text-muted-foreground mt-1">
              Нажмите кнопку, чтобы получить свой вариант задания
            </p>
          </div>
          {assignMutation.error && (
            <p className="text-sm text-destructive">
              {(assignMutation.error as Error).message || "Не удалось получить вариант"}
            </p>
          )}
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            size="lg"
          >
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4 mr-2" />
            )}
            Получить задание
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show assigned variant
  const assignment = assignMutation.data?.assignment ?? data?.assignment
  if (!assignment) return null

  const content = assignment.content as Record<string, unknown>
  const contentType = ("contentType" in assignment ? assignment.contentType : null) as string | null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Ваш вариант #{assignment.variantIndex + 1}
          </CardTitle>
          {"topic" in assignment && assignment.topic && (
            <Badge variant="secondary">{assignment.topic as string}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* QUIZ / MATH content */}
        {Array.isArray(content?.questions) && (
          <VariantQuestions questions={content.questions as QuestionItem[]} />
        )}

        {/* PROGRAMMING content */}
        {typeof content?.title === "string" && typeof content?.statement === "string" && (
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">{content.title as string}</h3>
            <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
              {content.statement as string}
            </div>
            {Array.isArray(content?.allowedLanguages) && (
              <p className="text-xs text-muted-foreground">
                Языки: {(content.allowedLanguages as string[]).join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Fallback: raw JSON */}
        {!Array.isArray(content?.questions) && typeof content?.title !== "string" && (
          <pre className="text-xs overflow-auto max-h-60 bg-muted rounded p-3 whitespace-pre-wrap">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

interface QuestionItem {
  text: string
  options: { text: string; isCorrect?: boolean }[]
}

function VariantQuestions({ questions }: { questions: QuestionItem[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="border rounded-lg p-3 space-y-2">
          <p className="font-medium text-sm">
            {qi + 1}. {q.text}
          </p>
          <div className="grid gap-1.5">
            {q.options.map((o, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                className={`text-left text-sm rounded px-3 py-2 border transition-colors ${
                  answers[qi] === oi
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                {o.text}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Выберите ответы. Оценивание выполняется преподавателем.
      </p>
    </div>
  )
}
