"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { adminAi, type AiQuestionsDraft } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type GenerateType = "math" | "quiz"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId: string
  onApplied: () => void
}

export function AiGenerateQuestionsDialog({ open, onOpenChange, assessmentId, onApplied }: Props) {
  const [genType, setGenType] = useState<GenerateType>("quiz")
  const [topic, setTopic] = useState("")
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [draft, setDraft] = useState<AiQuestionsDraft | null>(null)

  const generateMutation = useMutation({
    mutationFn: () => {
      const params = { topic, count, difficulty, language: "ru" as const }
      return genType === "math"
        ? adminAi.generateMathQuestions(params)
        : adminAi.generateQuizQuestions(params)
    },
    onSuccess: (data) => setDraft(data),
    onError: (e) => {
      const err = e as Error & { status?: number }
      if (err.status === 503) {
        toast.error("AI сервис сейчас недоступен. Попробуйте позже.")
      } else {
        toast.error(err.message || "Ошибка генерации")
      }
    },
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      adminAi.applyQuestions({
        assessmentId: Number(assessmentId),
        draft: draft!,
      }),
    onSuccess: () => {
      toast.success("Вопросы добавлены в тест")
      setDraft(null)
      setTopic("")
      onOpenChange(false)
      onApplied()
    },
    onError: (e) => {
      const err = e as Error & { status?: number }
      if (err.status === 409) {
        toast.error("Конфликт: вопросы уже были применены")
      } else if (err.status === 400) {
        toast.error(err.message || "Невозможно применить: проверьте статус теста")
      } else {
        toast.error(err.message || "Ошибка применения")
      }
    },
  })

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setDraft(null)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Генерация вопросов с AI
          </DialogTitle>
        </DialogHeader>

        {!draft ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Тип генерации</Label>
              <Select value={genType} onValueChange={(v) => setGenType(v as GenerateType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Тестовые вопросы</SelectItem>
                  <SelectItem value="math">Математические вопросы</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Тема</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Линейная алгебра, Базы данных..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Количество вопросов</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Сложность</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Лёгкая</SelectItem>
                    <SelectItem value="medium">Средняя</SelectItem>
                    <SelectItem value="hard">Сложная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !topic.trim()}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Генерация... (до 1–2 минут)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Сгенерировать
                </>
              )}
            </Button>
            {generateMutation.isPending && (
              <p className="text-xs text-muted-foreground text-center">
                Нейросеть генерирует вопросы. Это может занять до 1–2 минут.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Сгенерировано вопросов: {draft.questions.length}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraft(null)}
              >
                Назад к форме
              </Button>
            </div>

            <div className="space-y-3">
              {draft.questions.map((q, qi) => (
                <div key={qi} className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">
                    <span className="text-muted-foreground mr-1">{qi + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-1 pl-4">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded text-sm",
                          opt.isCorrect
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {opt.isCorrect ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || applyMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Генерация...</>
                ) : (
                  "Перегенерировать"
                )}
              </Button>
              <Button
                className="flex-1"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending || generateMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Применение...</>
                ) : (
                  "Применить к тесту"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
