"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { adminAi, type AiProgrammingTaskDraft } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Clock, HardDrive } from "lucide-react"
import { toast } from "sonner"

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "cpp", label: "C++" },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  onApplied: () => void
}

export function AiGenerateProgrammingTaskDialog({ open, onOpenChange, lessonId, onApplied }: Props) {
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["python"])
  const [draft, setDraft] = useState<AiProgrammingTaskDraft | null>(null)

  function toggleLang(lang: string) {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const generateMutation = useMutation({
    mutationFn: () =>
      adminAi.generateProgrammingTask({
        topic,
        difficulty,
        allowedLanguages: selectedLangs,
        language: "ru",
      }),
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
      adminAi.applyProgrammingTask({
        lessonId: Number(lessonId),
        draft: draft!,
      }),
    onSuccess: () => {
      toast.success("Задача создана и привязана к занятию")
      setDraft(null)
      setTopic("")
      onOpenChange(false)
      onApplied()
    },
    onError: (e) => {
      const err = e as Error & { status?: number }
      if (err.status === 409) {
        toast.error("Для этого занятия задача уже создана")
      } else if (err.status === 400) {
        toast.error(err.message || "Невозможно применить: занятие не LAB_PROGRAMMING или другая ошибка")
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
            Генерация задачи с AI
          </DialogTitle>
        </DialogHeader>

        {!draft ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Тема задачи</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Сортировка массивов, Рекурсия..."
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
            <div className="space-y-1.5">
              <Label>Языки программирования</Label>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => toggleLang(lang.value)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      selectedLangs.includes(lang.value)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !topic.trim() || selectedLangs.length === 0}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Генерация... (до 1–2 минут)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Сгенерировать задачу
                </>
              )}
            </Button>
            {generateMutation.isPending && (
              <p className="text-xs text-muted-foreground text-center">
                Нейросеть генерирует задачу. Это может занять до 1–2 минут.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Предпросмотр задачи</p>
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Назад к форме
              </Button>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Название</p>
              <p className="text-sm font-semibold">{draft.title}</p>
            </div>

            {/* Statement */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Условие</p>
              <div className="bg-secondary rounded-lg p-3 text-sm whitespace-pre-wrap">
                {draft.statement}
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-2">
              {draft.allowedLanguages.map((lang) => (
                <Badge key={lang} variant="outline">{lang}</Badge>
              ))}
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {draft.timeLimitMs}ms
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {Math.round(draft.memoryLimitKb / 1024)}MB
              </Badge>
            </div>

            {/* Test cases */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Тест-кейсы ({draft.testCases.length})
              </p>
              <div className="space-y-2">
                {draft.testCases.map((tc, i) => (
                  <div key={i} className="border border-border rounded-lg p-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Вход</p>
                        <pre className="bg-secondary p-1.5 rounded font-mono whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Ожидаемый выход</p>
                        <pre className="bg-secondary p-1.5 rounded font-mono whitespace-pre-wrap">{tc.expected}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  "Применить к занятию"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
