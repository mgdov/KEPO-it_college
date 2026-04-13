"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { admin, adminPools, type TaskPool, type TaskPoolDetail, type TaskPoolVariant, type LessonPoolLink, type AdminLesson } from "@/lib/api"
import {
  Database, Loader2, Trash2, Play, RefreshCw, ChevronRight,
  Plus, Eye, AlertCircle, CheckCircle2, Clock, XCircle, Link2, Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type ContentType = "QUIZ" | "MATH" | "PROGRAMMING"
type Difficulty = "easy" | "medium" | "hard"

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  QUIZ: "Тест (Quiz)",
  MATH: "Математика",
  PROGRAMMING: "Программирование",
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Ожидает", icon: Clock, variant: "secondary" },
  GENERATING: { label: "Генерация...", icon: Loader2, variant: "outline" },
  READY: { label: "Готов", icon: CheckCircle2, variant: "default" },
  FAILED: { label: "Ошибка", icon: XCircle, variant: "destructive" },
}

export default function PoolsPage() {
  const qc = useQueryClient()
  const [view, setView] = useState<"list" | "create" | "detail">("list")
  const [detailId, setDetailId] = useState<number | null>(null)

  // ── Create form state ──
  const [subjectId, setSubjectId] = useState("")
  const [topic, setTopic] = useState("")
  const [contentType, setContentType] = useState<ContentType>("QUIZ")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [targetCount, setTargetCount] = useState(30)

  // ── Data ──
  const { data: subjects = [] } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: admin.subjects,
  })

  const { data: poolsData, isLoading: loadingPools } = useQuery({
    queryKey: ["admin", "pools"],
    queryFn: () => adminPools.list({ pageSize: 100 }),
    refetchInterval: 10_000, // auto-refresh to track generation progress
  })

  const pools = poolsData?.data ?? (Array.isArray(poolsData) ? [] : [])

  const { data: poolDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["admin", "pools", detailId],
    queryFn: () => adminPools.get(detailId!),
    enabled: view === "detail" && detailId !== null,
  })

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: () =>
      adminPools.create({
        subjectId: Number(subjectId),
        topic: topic.trim(),
        contentType,
        difficulty,
        targetCount,
      }),
    onSuccess: () => {
      toast.success("Пул создан")
      qc.invalidateQueries({ queryKey: ["admin", "pools"] })
      setView("list")
      setTopic("")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const generateMutation = useMutation({
    mutationFn: (id: number) => adminPools.generate(id),
    onSuccess: () => {
      toast.success("Генерация запущена")
      qc.invalidateQueries({ queryKey: ["admin", "pools"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminPools.delete(id),
    onSuccess: () => {
      toast.success("Пул удалён")
      qc.invalidateQueries({ queryKey: ["admin", "pools"] })
      if (view === "detail") setView("list")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ── Render ──
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Пулы заданий</h1>
          <p className="text-sm text-muted-foreground">
            Предварительно сгенерированные варианты для мгновенной выдачи студентам
          </p>
        </div>
        {view === "list" && (
          <Button onClick={() => setView("create")}>
            <Plus className="h-4 w-4 mr-1" />
            Создать пул
          </Button>
        )}
        {view !== "list" && (
          <Button variant="outline" onClick={() => setView("list")}>
            ← Назад к списку
          </Button>
        )}
      </div>

      {/* ── CREATE FORM ─── */}
      {view === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Новый пул</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-1.5">
              <Label>Тема</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Линейные уравнения"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Тип контента</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setContentType(t)}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      contentType === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {CONTENT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

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

            <div className="space-y-1.5">
              <Label>Количество вариантов</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={targetCount}
                onChange={(e) => setTargetCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-32"
              />
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={!subjectId || !topic.trim() || createMutation.isPending}
              className="w-full"
              size="lg"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-1" />
              )}
              Создать пул
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── LIST ─── */}
      {view === "list" && (
        <div className="space-y-3">
          {loadingPools && (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          )}

          {!loadingPools && pools.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Database className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Пулов пока нет. Создайте первый!</p>
              </CardContent>
            </Card>
          )}

          {pools.map((pool: TaskPool) => {
            const sc = STATUS_CONFIG[pool.status] ?? STATUS_CONFIG.PENDING
            const Icon = sc.icon
            return (
              <Card key={pool.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{pool.topic}</span>
                      <Badge variant={sc.variant} className="text-xs shrink-0">
                        <Icon className={`h-3 w-3 mr-1 ${pool.status === "GENERATING" ? "animate-spin" : ""}`} />
                        {sc.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{pool.subject?.name ?? `Предмет #${pool.subjectId}`}</span>
                      <span>•</span>
                      <span>{CONTENT_TYPE_LABELS[pool.contentType as ContentType] ?? pool.contentType}</span>
                      <span>•</span>
                      <span>{DIFFICULTY_LABELS[pool.difficulty as Difficulty] ?? pool.difficulty}</span>
                      <span>•</span>
                      <span>{pool._count?.variants ?? 0}/{pool.targetCount} вариантов</span>
                      {(pool._count?.assignments ?? 0) > 0 && (
                        <>
                          <span>•</span>
                          <span>{pool._count.assignments} выдано</span>
                        </>
                      )}
                    </div>
                    {pool.status === "GENERATING" && (
                      <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all animate-pulse"
                          style={{ width: `${Math.max(5, ((pool._count?.variants ?? 0) / pool.targetCount) * 100)}%` }}
                        />
                      </div>
                    )}
                    {pool.errorMessage && (
                      <p className="text-xs text-destructive mt-1 truncate">{pool.errorMessage}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {(pool.status === "PENDING" || pool.status === "READY" || pool.status === "FAILED") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateMutation.mutate(pool.id)}
                        disabled={generateMutation.isPending}
                        title="Запустить генерацию"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setDetailId(pool.id); setView("detail") }}
                      title="Подробнее"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Удалить пул и все его варианты?")) {
                          deleteMutation.mutate(pool.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      title="Удалить"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── DETAIL ─── */}
      {view === "detail" && (
        <div className="space-y-4">
          {loadingDetail && (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          )}

          {poolDetail && (() => {
            const detail = poolDetail as unknown as TaskPoolDetail
            const sc = STATUS_CONFIG[detail.status] ?? STATUS_CONFIG.PENDING
            const Icon = sc.icon
            return (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{detail.topic}</CardTitle>
                      <Badge variant={sc.variant}>
                        <Icon className={`h-3 w-3 mr-1 ${detail.status === "GENERATING" ? "animate-spin" : ""}`} />
                        {sc.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Предмет: </span>
                        {detail.subject?.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Тип: </span>
                        {CONTENT_TYPE_LABELS[detail.contentType as ContentType]}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Сложность: </span>
                        {DIFFICULTY_LABELS[detail.difficulty as Difficulty]}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Варианты: </span>
                        {detail.variants?.length ?? 0}/{detail.targetCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Выдано: </span>
                        {detail._count?.assignments ?? 0}
                      </div>
                    </div>

                    {detail.errorMessage && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {detail.errorMessage}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {detail.status !== "GENERATING" && (
                        <Button
                          size="sm"
                          onClick={() => generateMutation.mutate(detail.id)}
                          disabled={generateMutation.isPending}
                        >
                          {generateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          {(detail.variants?.length ?? 0) > 0 ? "Догенерировать" : "Запустить генерацию"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => qc.invalidateQueries({ queryKey: ["admin", "pools", detailId] })}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Обновить
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lesson links */}
                <LessonLinksSection poolId={detail.id} subjectId={detail.subjectId} />

                {/* Variants preview */}
                {detail.variants && detail.variants.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Варианты ({detail.variants.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {detail.variants.map((v) => (
                        <VariantPreview key={v.id} variant={v} contentType={detail.contentType} />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ── Variant preview component ────────────────────────────────────────────────

function VariantPreview({ variant, contentType }: { variant: TaskPoolVariant; contentType: string }) {
  const [expanded, setExpanded] = useState(false)
  const content = variant.contentJson as Record<string, unknown>

  let summary = `Вариант #${variant.variantIndex + 1}`
  if (contentType === "PROGRAMMING" && content?.title) {
    summary = `#${variant.variantIndex + 1}: ${content.title}`
  } else if ((contentType === "QUIZ" || contentType === "MATH") && Array.isArray(content?.questions)) {
    summary = `#${variant.variantIndex + 1}: ${(content.questions as unknown[]).length} вопросов`
  }

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
      >
        <span className="font-medium">{summary}</span>
        <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t">
          <pre className="text-xs mt-2 overflow-auto max-h-60 bg-muted rounded p-2 whitespace-pre-wrap">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Lesson links section ─────────────────────────────────────────────────────

function LessonLinksSection({ poolId, subjectId }: { poolId: number; subjectId: number }) {
  const qc = useQueryClient()
  const [showPicker, setShowPicker] = useState(false)
  const [selectedLessonId, setSelectedLessonId] = useState("")

  const { data: linksRaw } = useQuery({
    queryKey: ["admin", "pool-links", poolId],
    queryFn: () => adminPools.getLessonLinks(poolId),
  })
  const links: LessonPoolLink[] = Array.isArray(linksRaw) ? linksRaw : []

  // Load lessons for the same subject
  const { data: lessons = [] } = useQuery({
    queryKey: ["admin", "lessons-for-link", subjectId],
    queryFn: () => admin.lessons({ subjectId: String(subjectId) }),
    enabled: showPicker,
  })

  const linkMutation = useMutation({
    mutationFn: (lessonId: number) => adminPools.linkLesson(poolId, lessonId),
    onSuccess: () => {
      toast.success("Пул привязан к занятию")
      qc.invalidateQueries({ queryKey: ["admin", "pool-links", poolId] })
      setShowPicker(false)
      setSelectedLessonId("")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const unlinkMutation = useMutation({
    mutationFn: (lessonId: number) => adminPools.unlinkLesson(poolId, lessonId),
    onSuccess: () => {
      toast.success("Привязка удалена")
      qc.invalidateQueries({ queryKey: ["admin", "pool-links", poolId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Filter out already-linked lessons
  const linkedIds = new Set(links.map((l) => l.lessonId))
  const availableLessons = lessons.filter((l: AdminLesson) => !linkedIds.has(Number(l.id)))

  const LESSON_TYPE_LABELS: Record<string, string> = {
    LECTURE: "ЛК", LAB_QUIZ: "ЛЗ (тест)", LAB_MATH: "ЛЗ (мат.)",
    LAB_PROGRAMMING: "ЛЗ (прог.)", LAB_GAME: "ЛЗ (игра)", EXAM: "Экзамен", CREDIT: "Зачёт",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Привязанные занятия ({links.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowPicker(!showPicker)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Привязать
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showPicker && (
          <div className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Выберите занятие</Label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">—</option>
                {availableLessons.map((l: AdminLesson) => (
                  <option key={l.id} value={l.id}>
                    {l.group?.name} — {LESSON_TYPE_LABELS[l.lessonType] ?? l.lessonType} — {new Date(l.startsAt).toLocaleDateString("ru-RU")}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              disabled={!selectedLessonId || linkMutation.isPending}
              onClick={() => linkMutation.mutate(Number(selectedLessonId))}
            >
              {linkMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Привязать"}
            </Button>
          </div>
        )}

        {links.length === 0 && !showPicker && (
          <p className="text-sm text-muted-foreground py-2">
            Пул не привязан ни к одному занятию. Привяжите, чтобы студенты получали варианты автоматически.
          </p>
        )}

        {links.map((link) => (
          <div key={link.id} className="flex items-center justify-between py-2 px-3 border rounded-md text-sm">
            <div>
              <span className="font-medium">{link.lesson?.group?.name}</span>
              <span className="text-muted-foreground mx-1">—</span>
              <span>{LESSON_TYPE_LABELS[link.lesson?.lessonType ?? ""] ?? link.lesson?.lessonType}</span>
              <span className="text-muted-foreground mx-1">—</span>
              <span>{link.lesson?.date ? new Date(link.lesson.date).toLocaleDateString("ru-RU") : `#${link.lessonId}`}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive h-7 px-2"
              onClick={() => unlinkMutation.mutate(link.lessonId)}
              disabled={unlinkMutation.isPending}
            >
              <Unlink className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
