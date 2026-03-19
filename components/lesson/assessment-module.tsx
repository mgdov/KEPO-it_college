"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { student, type Assessment, type AttemptDetail } from "@/lib/api"
import {
  CheckCircle, XCircle, Clock, Trophy, AlertCircle, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Props {
  lessonId: string
  assessment: Assessment
}

type Phase = "intro" | "attempt" | "result"

export function AssessmentModule({ lessonId, assessment }: Props) {
  const qc = useQueryClient()
  const [phase, setPhase] = useState<Phase>("intro")
  const [currentAttempt, setCurrentAttempt] = useState<AttemptDetail | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null)
  const [currentQ, setCurrentQ] = useState(0)

  const startMutation = useMutation({
    mutationFn: () => student.startAttempt(lessonId),
    onSuccess: async (attempt) => {
      const detail = await student.getAttempt(attempt.id)
      setCurrentAttempt(detail)
      setAnswers({})
      setCurrentQ(0)
      setPhase("attempt")
    },
  })

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!currentAttempt) throw new Error("No attempt")
      const answerArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      }))
      return student.submitAttempt(currentAttempt.id, answerArray)
    },
    onSuccess: (res) => {
      setResult(res)
      setPhase("result")
      qc.invalidateQueries({ queryKey: ["student", "grades"] })
    },
  })

  if (phase === "intro") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-primary" />
            {assessment.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {assessment.durationMinutes && (
              <InfoBox icon={Clock} label="Время" value={`${assessment.durationMinutes} мин`} />
            )}
            {assessment.maxAttempts && (
              <InfoBox icon={ChevronRight} label="Попыток" value={String(assessment.maxAttempts)} />
            )}
            {assessment.passingScore && (
              <InfoBox icon={CheckCircle} label="Проходной балл" value={`${assessment.passingScore}%`} />
            )}
          </div>

          {startMutation.error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {(startMutation.error as Error).message}
            </div>
          )}

          <Button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="w-full"
            size="lg"
          >
            {startMutation.isPending ? "Начинаем..." : "Начать тест"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "attempt" && currentAttempt) {
    const questions = currentAttempt.questions
    const q = questions[currentQ]
    const answered = Object.keys(answers).length
    const progress = Math.round((answered / questions.length) * 100)

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{assessment.title}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {currentQ + 1} / {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="rounded-lg bg-secondary p-4">
            <p className="font-medium text-foreground leading-relaxed">{q.text}</p>
          </div>

          {/* Options */}
          <RadioGroup
            value={answers[q.id] ?? ""}
            onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
            className="space-y-3"
          >
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === opt.id
              return (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} />
                  <Label
                    htmlFor={`opt-${opt.id}`}
                    className="cursor-pointer flex-1 leading-snug"
                  >
                    <span className="font-medium text-muted-foreground mr-2">
                      {["А", "Б", "В", "Г"][idx]}.
                    </span>
                    {opt.text}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
            >
              Назад
            </Button>

            {currentQ < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQ((p) => p + 1)}
                disabled={!answers[q.id]}
              >
                Далее
              </Button>
            ) : (
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || answered < questions.length}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitMutation.isPending ? "Отправка..." : "Завершить тест"}
              </Button>
            )}
          </div>

          {/* Question dots */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setCurrentQ(i)}
                className={cn(
                  "h-7 w-7 rounded-full text-xs font-medium transition-colors",
                  i === currentQ
                    ? "bg-primary text-primary-foreground"
                    : answers[qq.id]
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                    : "bg-muted text-muted-foreground border border-border"
                )}
                aria-label={`Вопрос ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "result" && result) {
    const pct = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <div className="flex justify-center">
            {result.passed ? (
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {result.passed ? "Тест пройден!" : "Тест не пройден"}
          </h3>
          <p className="text-muted-foreground">
            Результат:{" "}
            <span className="font-bold text-foreground">
              {result.score} / {result.maxScore}
            </span>{" "}
            ({pct}%)
          </p>
          <Progress value={pct} className="max-w-sm mx-auto" />
          <Button onClick={() => setPhase("intro")} variant="outline">
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-secondary p-3 text-center">
      <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
