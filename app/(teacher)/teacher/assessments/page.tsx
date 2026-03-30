"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { admin, type AssessmentDetail } from "@/lib/api"
import {
  Plus, Trash2, Eye, CheckCircle, XCircle, ChevronDown, ClipboardList, Import, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AiGenerateQuestionsDialog } from "@/components/admin/ai-generate-questions-dialog"

export default function TeacherAssessmentsPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["admin", "assessments"],
    queryFn: () => admin.assessments(),
  })
  const { data: detail } = useQuery({
    queryKey: ["admin", "assessment", selectedId],
    queryFn: () => admin.assessment(selectedId!),
    enabled: !!selectedId,
  })
  const { data: lessons = [] } = useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: () => admin.lessons(),
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => admin.publishAssessment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assessments"] })
      toast.success("Тест опубликован")
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (qid: string) => admin.deleteQuestion(qid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assessment", selectedId] })
    },
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Тесты</h1>
          <p className="text-sm text-muted-foreground">Управление тестами и вопросами</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Создать тест</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый тест</DialogTitle></DialogHeader>
            <CreateAssessmentForm
              lessons={lessons}
              onSuccess={(id) => {
                qc.invalidateQueries({ queryKey: ["admin", "assessments"] })
                setSelectedId(id)
                toast.success("Тест создан")
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))
          ) : assessments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Тестов нет
              </CardContent>
            </Card>
          ) : (
            assessments.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-colors",
                  selectedId === a.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground truncate">{a.title}</span>
                  {a.isPublished ? (
                    <Badge className="bg-green-500/20 text-green-600 border-0 text-xs ml-auto flex-shrink-0">
                      Опубликован
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">Черновик</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{a.assessmentType}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedId ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                Выберите тест для редактирования
              </CardContent>
            </Card>
          ) : !detail ? (
            <div className="h-40 bg-muted animate-pulse rounded-lg" />
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">{detail.title}</CardTitle>
                  <div className="flex gap-2">
                    {!detail.isPublished && (
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(detail.id)}
                        disabled={publishMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Опубликовать
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <InfoPill label="Тип" value={detail.assessmentType} />
                  <InfoPill label="Вопросов" value={String(detail.questions?.length ?? 0)} />
                  {detail.passingScore && <InfoPill label="Проходной балл" value={`${detail.passingScore}%`} />}
                  {detail.durationMinutes && <InfoPill label="Время" value={`${detail.durationMinutes} мин`} />}
                  {detail.maxAttempts && <InfoPill label="Попыток" value={String(detail.maxAttempts)} />}
                </CardContent>
              </Card>

              {detail && (
                <AiGenerateQuestionsDialog
                  open={aiOpen}
                  onOpenChange={setAiOpen}
                  assessmentId={detail.id}
                  onApplied={() => {
                    qc.invalidateQueries({ queryKey: ["admin", "assessment", selectedId] })
                    qc.invalidateQueries({ queryKey: ["admin", "assessments"] })
                  }}
                />
              )}

              {/* Questions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Вопросы ({detail.questions?.length ?? 0})</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAiOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> AI
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Import className="h-3.5 w-3.5 mr-1" /> Импорт
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Импорт вопросов</DialogTitle></DialogHeader>
                        <ImportQuestionsForm
                          assessmentId={detail.id}
                          onSuccess={() => {
                            qc.invalidateQueries({ queryKey: ["admin", "assessment", selectedId] })
                            toast.success("Вопросы импортированы")
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Добавить
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Новый вопрос</DialogTitle></DialogHeader>
                        <AddQuestionForm
                          assessmentId={detail.id}
                          onSuccess={() => {
                            qc.invalidateQueries({ queryKey: ["admin", "assessment", selectedId] })
                            toast.success("Вопрос добавлен")
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {!detail.questions?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Вопросов нет. Добавьте или импортируйте.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.questions.map((q, qi) => (
                        <Collapsible key={q.id}>
                          <div className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                            <span className="text-xs font-bold text-muted-foreground w-6">{qi + 1}.</span>
                            <CollapsibleTrigger className="flex-1 text-left text-sm font-medium text-foreground truncate">
                              {q.text}
                            </CollapsibleTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-7 w-7 p-0"
                              onClick={() => deleteQuestionMutation.mutate(q.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="pl-8 pt-2 pb-3 space-y-1.5">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded text-sm",
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
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

const ASSESSMENT_LESSON_TYPES = ["EXAM", "LAB_MATH", "LAB_QUIZ", "CREDIT"]

function CreateAssessmentForm({
  lessons,
  onSuccess,
}: {
  lessons: { id: string; lessonType: string; subject: { name: string }; group: { name: string } }[]
  onSuccess: (id: string) => void
}) {
  const filteredLessons = lessons.filter((l) => ASSESSMENT_LESSON_TYPES.includes(l.lessonType))
  const [lessonId, setLessonId] = useState("")
  const [title, setTitle] = useState("")
  const [type, setType] = useState("QUIZ")
  const [passing, setPassing] = useState("60")
  const [duration, setDuration] = useState("30")
  const [attempts, setAttempts] = useState("3")

  const mutation = useMutation({
    mutationFn: () =>
      admin.createAssessment(lessonId, {
        title,
        assessmentType: type,
        passingScore: Number(passing),
        durationMinutes: Number(duration),
        maxAttempts: Number(attempts),
      }),
    onSuccess: (res) => onSuccess(res.id),
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Занятие</Label>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Выберите занятие</option>
          {filteredLessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.subject.name} — {l.group.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Название теста</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Тест по теме..." />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Проходной %</Label>
          <Input type="number" value={passing} onChange={(e) => setPassing(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Минут</Label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Попыток</Label>
          <Input type="number" value={attempts} onChange={(e) => setAttempts(e.target.value)} />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !lessonId || !title}
      >
        {mutation.isPending ? "Создание..." : "Создать тест"}
      </Button>
    </div>
  )
}

function AddQuestionForm({
  assessmentId,
  onSuccess,
}: {
  assessmentId: string
  onSuccess: () => void
}) {
  const [text, setText] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correct, setCorrect] = useState(0)

  const mutation = useMutation({
    mutationFn: () =>
      admin.addQuestion(assessmentId, {
        text,
        options: options.map((o, i) => ({ text: o, isCorrect: i === correct })),
      }),
    onSuccess,
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Текст вопроса</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Варианты ответа (выберите правильный)</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correct === i}
              onChange={() => setCorrect(i)}
              className="accent-primary"
            />
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                setOptions(next)
              }}
              placeholder={`Вариант ${["А", "Б", "В", "Г"][i]}`}
            />
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !text || options.some((o) => !o.trim())}
      >
        {mutation.isPending ? "Добавление..." : "Добавить вопрос"}
      </Button>
    </div>
  )
}

function ImportQuestionsForm({
  assessmentId,
  onSuccess,
}: {
  assessmentId: string
  onSuccess: () => void
}) {
  const [text, setText] = useState("")

  const mutation = useMutation({
    mutationFn: () => admin.importQuestions(assessmentId, text),
    onSuccess,
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Введите вопросы в формате, который поддерживает API.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Вопрос 1&#10;А) вариант&#10;Б) вариант&#10;В) вариант&#10;Г) вариант&#10;Ответ: А"
      />
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !text.trim()}
      >
        {mutation.isPending ? "Импорт..." : "Импортировать"}
      </Button>
    </div>
  )
}
