"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { admin, adminAi, adminPools, type AiQuestionsDraft, type AiProgrammingTaskDraft } from "@/lib/api"
import { Sparkles, Loader2, CheckCircle, RotateCcw, Save, ChevronRight, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Неизвестная ошибка"
  const status = (e as { status?: number }).status
  if (status === 409) return "Конфликт: объект уже существует (возможно, занятие уже имеет оценивание)"
  if (status === 503) return "AI-сервис временно недоступен. Попробуйте позже."
  if (status === 400) return `Ошибка валидации: ${msg}`
  return msg
}

type TaskType = "quiz" | "math" | "lab" | "exam"
type Difficulty = "easy" | "medium" | "hard"
type Step = "form" | "generating" | "preview"

const TASK_LABELS: Record<TaskType, string> = {
  quiz: "Тест (Quiz)",
  math: "Тест (Математика)",
  lab: "Лабораторная (код)",
  exam: "Экзамен",
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
}

const LESSON_TYPE_MAP: Record<TaskType, string> = {
  quiz: "LAB_QUIZ",
  math: "LAB_MATH",
  lab: "LAB_PROGRAMMING",
  exam: "EXAM",
}

const ASSESSMENT_TYPE_MAP: Record<string, string> = {
  quiz: "QUIZ",
  math: "MATH",
  exam: "EXAM",
}

const POOL_CONTENT_TYPE_MAP: Record<TaskType, "QUIZ" | "MATH" | "PROGRAMMING"> = {
  quiz: "QUIZ",
  math: "MATH",
  lab: "PROGRAMMING",
  exam: "QUIZ",
}

type GenerateMode = "single" | "pool"

export default function GeneratePage() {
  const qc = useQueryClient()

  // form state
  const [mode, setMode] = useState<GenerateMode>("single")
  const [subjectId, setSubjectId] = useState("")
  const [groupId, setGroupId] = useState("")
  const [topic, setTopic] = useState("")
  const [taskType, setTaskType] = useState<TaskType>("quiz")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [count, setCount] = useState(5)
  const [poolTargetCount, setPoolTargetCount] = useState(30)

  // flow state
  const [step, setStep] = useState<Step>("form")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questionsDraft, setQuestionsDraft] = useState<AiQuestionsDraft | null>(null)
  const [programmingDraft, setProgrammingDraft] = useState<AiProgrammingTaskDraft | null>(null)
  const [error, setError] = useState("")

  // data
  const { data: subjects = [] } = useQuery({ queryKey: ["admin", "subjects"], queryFn: admin.subjects })
  const { data: groups = [] } = useQuery({ queryKey: ["admin", "groups"], queryFn: admin.groups })

  const selectedSubject = subjects.find((s) => s.id === subjectId)
  const selectedGroup = groups.find((g) => g.id === groupId)

  const canGenerate = subjectId && (mode === "pool" || groupId) && topic.trim().length >= 2

  // ─── Generate ──────────────────────────────────────────────
  async function handleGenerate() {
    setError("")
    setGenerating(true)
    setStep("generating")
    setQuestionsDraft(null)
    setProgrammingDraft(null)

    try {
      if (taskType === "lab") {
        const draft = await adminAi.generateProgrammingTask({
          topic: topic.trim(),
          difficulty,
          allowedLanguages: ["python", "javascript"],
        })
        setProgrammingDraft(draft)
      } else {
        const genFn = taskType === "math"
          ? adminAi.generateMathQuestions
          : adminAi.generateQuizQuestions
        const draft = await genFn({
          topic: topic.trim(),
          count,
          difficulty,
        })
        setQuestionsDraft(draft)
      }
      setStep("preview")
    } catch (e: unknown) {
      setError(friendlyError(e))
      setStep("form")
    } finally {
      setGenerating(false)
    }
  }

  // ─── Save: create lesson → create assessment → apply draft ──
  // Or in pool mode: create pool → trigger generation
  async function handleSave() {
    if (!selectedSubject) return
    setSaving(true)
    setError("")

    try {
      if (mode === "pool") {
        // Pool mode: create pool + trigger background generation
        const pool = await adminPools.create({
          subjectId: Number(subjectId),
          topic: topic.trim(),
          contentType: POOL_CONTENT_TYPE_MAP[taskType],
          difficulty,
          targetCount: poolTargetCount,
        })

        await adminPools.generate(pool.id)

        qc.invalidateQueries({ queryKey: ["admin", "pools"] })

        toast.success(
          `Пул «${topic.trim()}» создан — генерация ${poolTargetCount} вариантов запущена`
        )

        // reset
        setStep("form")
        setTopic("")
        setQuestionsDraft(null)
        setProgrammingDraft(null)
        return
      }

      // Single mode — original flow
      if (!selectedGroup) return
      const now = new Date()
      const end = new Date(now.getTime() + 90 * 60_000)

      // 1. Create lesson
      const lesson = await admin.createLesson({
        subjectId: Number(subjectId),
        groupId: Number(groupId),
        lessonType: LESSON_TYPE_MAP[taskType],
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
      })

      if (taskType === "lab" && programmingDraft) {
        // 2a. Apply programming task to lesson
        await adminAi.applyProgrammingTask({
          lessonId: Number(lesson.id),
          draft: programmingDraft,
        })
        toast.success(`Лабораторная "${programmingDraft.title}" создана и привязана`)
      } else if (questionsDraft) {
        // 2b. Create assessment for lesson
        const assessmentType = ASSESSMENT_TYPE_MAP[taskType] ?? "QUIZ"
        const assessment = await admin.createAssessment(lesson.id, {
          title: `${selectedSubject.name}: ${topic.trim()}`,
          assessmentType,
          passingScore: 60,
          durationMinutes: 30,
          maxAttempts: 3,
        })

        // 3. Apply AI draft to assessment
        await adminAi.applyQuestions({
          assessmentId: Number(assessment.id),
          draft: questionsDraft,
        })

        // 4. Publish (ignore if already published)
        try { await admin.publishAssessment(assessment.id) } catch { /* already published */ }

        toast.success(
          `${TASK_LABELS[taskType]} создан: ${questionsDraft.questions.length} вопросов → опубликован`
        )
      }

      // invalidate queries
      qc.invalidateQueries({ queryKey: ["admin", "lessons"] })
      qc.invalidateQueries({ queryKey: ["admin", "assessments"] })

      // reset
      setStep("form")
      setTopic("")
      setQuestionsDraft(null)
      setProgrammingDraft(null)
    } catch (e: unknown) {
      const msg = friendlyError(e)
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Генератор заданий</h1>
        <p className="text-sm text-muted-foreground">
          Быстрое создание тестов, лабораторных и экзаменов с помощью AI
        </p>
      </div>

      {/* ── Step indicators (single mode only) ── */}
      {mode === "single" && (
      <div className="flex items-center gap-2 text-sm">
        <StepBadge n={1} label="Параметры" active={step === "form"} done={step !== "form"} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepBadge n={2} label="Генерация" active={step === "generating"} done={step === "preview"} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepBadge n={3} label="Проверка и сохранение" active={step === "preview"} done={false} />
      </div>
      )}

      {/* ─── FORM ─── */}
      {step === "form" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Параметры задания</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="space-y-1.5">
              <Label>Режим</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("single")}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    mode === "single"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                  Разовое задание
                </button>
                <button
                  onClick={() => setMode("pool")}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    mode === "pool"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  <Database className="inline h-3.5 w-3.5 mr-1" />
                  Пул вариантов
                </button>
              </div>
              {mode === "pool" && (
                <p className="text-xs text-muted-foreground">
                  Будет создан пул из {poolTargetCount} уникальных вариантов для автоматической выдачи студентам.
                  Привязать к занятиям можно будет на странице «Пулы».
                </p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Предмет</Label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Выберите предмет</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Group (only for single mode) */}
            {mode === "single" && (
            <div className="space-y-1.5">
              <Label>Группа</Label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Выберите группу</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.specialty})</option>
                ))}
              </select>
            </div>
            )}

            {/* Topic */}
            <div className="space-y-1.5">
              <Label>Тема</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Линейные уравнения, SQL запросы..."
              />
            </div>

            {/* Task type */}
            <div className="space-y-1.5">
              <Label>Тип задания</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(TASK_LABELS) as TaskType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaskType(t)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      taskType === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {TASK_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label>Сложность</Label>
              <div className="flex gap-2">
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      difficulty === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Count (for quiz/math/exam, single mode only) */}
            {mode === "single" && taskType !== "lab" && (
              <div className="space-y-1.5">
                <Label>Количество вопросов</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                  className="w-32"
                />
              </div>
            )}

            {/* Pool variant count */}
            {mode === "pool" && (
              <div className="space-y-1.5">
                <Label>Количество вариантов</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={poolTargetCount}
                  onChange={(e) => setPoolTargetCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-32"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {mode === "single" ? (
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Сгенерировать
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!canGenerate || saving}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Создать пул и запустить генерацию
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── GENERATING ─── */}
      {step === "generating" && (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">AI генерирует задание...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Это может занять 1–2 минуты. Не закрывайте страницу.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── PREVIEW: Questions ─── */}
      {step === "preview" && questionsDraft && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Предпросмотр: {questionsDraft.questions.length} вопросов
              </CardTitle>
              <Badge variant="secondary">{TASK_LABELS[taskType]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedSubject?.name} → {selectedGroup?.name} → {topic}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionsDraft.questions.map((q, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium text-sm">
                  {i + 1}. {q.text}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {q.options.map((o, j) => (
                    <div
                      key={j}
                      className={`text-xs rounded px-2 py-1.5 ${
                        o.isCorrect
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {o.isCorrect && <CheckCircle className="inline h-3 w-3 mr-1" />}
                      {o.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Перегенерировать
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Создать занятие и сохранить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── PREVIEW: Programming task ─── */}
      {step === "preview" && programmingDraft && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{programmingDraft.title}</CardTitle>
              <Badge variant="secondary">Лабораторная</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedSubject?.name} → {selectedGroup?.name} → {topic}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Условие</Label>
              <div className="mt-1 border rounded-lg p-3 text-sm whitespace-pre-wrap bg-muted/50">
                {programmingDraft.statement}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Языки: </span>
                {programmingDraft.allowedLanguages.join(", ")}
              </div>
              <div>
                <span className="text-muted-foreground">Время: </span>
                {programmingDraft.timeLimitMs}ms
              </div>
              <div>
                <span className="text-muted-foreground">Память: </span>
                {programmingDraft.memoryLimitKb}KB
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Тест-кейсы ({programmingDraft.testCases.length})
              </Label>
              <div className="mt-1 space-y-2">
                {programmingDraft.testCases.slice(0, 3).map((tc, i) => (
                  <div key={i} className="border rounded p-2 text-xs font-mono grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Input:</span>
                      <pre className="mt-0.5 whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected:</span>
                      <pre className="mt-0.5 whitespace-pre-wrap">{tc.expected}</pre>
                    </div>
                  </div>
                ))}
                {programmingDraft.testCases.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    ...и ещё {programmingDraft.testCases.length - 3} тест-кейсов
                  </p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Перегенерировать
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Создать занятие и сохранить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${active ? "text-primary font-medium" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
        active ? "bg-primary text-primary-foreground" : done ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
      }`}>
        {done ? "✓" : n}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  )
}
