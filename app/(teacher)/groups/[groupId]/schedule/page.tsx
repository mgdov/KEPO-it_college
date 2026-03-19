"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useSearchParams } from "next/navigation"
import { format, isSameDay } from "date-fns"
import { ru } from "date-fns/locale"
import { admin, type AdminLesson } from "@/lib/api"
import { Calendar as CalendarIcon, Plus, Pencil, Trash2, Unlock, FileText, ClipboardList, Gamepad2 } from "lucide-react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LESSON_TYPES = [
  { value: "LECTURE", label: "Лекция" },
  { value: "LAB_TASK", label: "Лаб. задание" },
  { value: "LAB_GAME", label: "Лаб. игра" },
  { value: "LAB_CODE", label: "Лаб. код" },
  { value: "EXAM", label: "Экзамен" },
]

const GAME_TYPES = [
  { value: "CHESS", label: "Шахматы" },
  { value: "CHECKERS", label: "Шашки" },
  { value: "WORD", label: "Игра слов" },
  { value: "MILLIONAIRE", label: "Миллионер" },
  { value: "physical", label: "Физкультура" },
]

function toLocalDateTime(iso: string) {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const adjusted = new Date(date.getTime() - offset * 60000)
  return adjusted.toISOString().slice(0, 16)
}

function LessonType({ type }: { type: string }) {
  return <Badge variant="outline">{LESSON_TYPES.find((item) => item.value === type)?.label ?? type}</Badge>
}

export default function TeacherGroupSchedulePage() {
  const params = useParams<{ groupId: string }>()
  const searchParams = useSearchParams()
  const qc = useQueryClient()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCreateOpen, setCreateOpen] = useState(searchParams.get("create") === "1")
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null)
  const [unlockLesson, setUnlockLesson] = useState<AdminLesson | null>(null)

  const { data: group } = useQuery({
    queryKey: ["admin", "group", params.groupId],
    // TODO: connect to real API endpoint /api/admin/groups/:id
    queryFn: () => admin.group(params.groupId),
  })

  const { data: lessons = [], isLoading, error } = useQuery({
    queryKey: ["admin", "lessons", "group", params.groupId],
    // TODO: connect to real API endpoint /api/admin/lessons?groupId=...
    queryFn: () => admin.lessons({ groupId: params.groupId }),
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ["admin", "subjects"],
    // TODO: connect to real API endpoint /api/admin/subjects
    queryFn: admin.subjects,
  })

  const createMutation = useMutation({
    mutationFn: (payload: {
      subjectId: string
      lessonType: string
      gameType?: string
      startsAt: string
      endsAt: string
    }) =>
      admin.createLesson({
        groupId: params.groupId,
        subjectId: payload.subjectId,
        lessonType: payload.lessonType,
        gameType: payload.gameType,
        startsAt: new Date(payload.startsAt).toISOString(),
        endsAt: new Date(payload.endsAt).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Занятие добавлено")
      setCreateOpen(false)
      qc.invalidateQueries({ queryKey: ["admin", "lessons", "group", params.groupId] })
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: {
      lessonId: string
      subjectId: string
      lessonType: string
      gameType?: string
      startsAt: string
      endsAt: string
    }) =>
      admin.updateLesson(payload.lessonId, {
        subjectId: payload.subjectId,
        lessonType: payload.lessonType,
        gameType: payload.gameType,
        startsAt: new Date(payload.startsAt).toISOString(),
        endsAt: new Date(payload.endsAt).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Занятие обновлено")
      setEditingLesson(null)
      qc.invalidateQueries({ queryKey: ["admin", "lessons", "group", params.groupId] })
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => admin.deleteLesson(lessonId),
    onSuccess: () => {
      toast.success("Занятие удалено")
      qc.invalidateQueries({ queryKey: ["admin", "lessons", "group", params.groupId] })
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const unlockMutation = useMutation({
    mutationFn: (payload: { lessonId: string; studentId: string; reason: string }) =>
      admin.unlockLesson(payload.lessonId, {
        studentId: payload.studentId,
        reason: payload.reason,
      }),
    onSuccess: () => {
      toast.success("Доступ к занятию разблокирован")
      setUnlockLesson(null)
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const lessonsForDate = useMemo(() => {
    if (!selectedDate) return lessons
    return lessons
      .filter((lesson) => isSameDay(new Date(lesson.startsAt), selectedDate))
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
  }, [lessons, selectedDate])

  if (error) {
    return (
      <Card className="max-w-3xl mx-auto border-red-300">
        <CardContent className="py-10 text-center space-y-2">
          <p className="text-lg font-semibold">Не удалось загрузить расписание группы</p>
          <p className="text-sm text-muted-foreground">Проверьте доступ к API и повторите попытку.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="overflow-hidden border-[#0033A0]/20">
        <CardContent className="bg-linear-to-r from-[#0033A0] to-[#1147b8] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Группа</p>
              <h1 className="text-2xl font-bold">{group?.name ?? "Расписание"}</h1>
              <p className="text-sm text-white/80">Календарь занятий, материалы, тесты и лабораторные.</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-[#0033A0] hover:bg-white/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить занятие
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новое занятие</DialogTitle>
                </DialogHeader>
                <LessonForm
                  subjects={subjects}
                  onSubmit={(data) => createMutation.mutate(data)}
                  isPending={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#0033A0]" />
              Календарь
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ru}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Занятия {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: ru }) : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-14 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : lessonsForDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">На выбранную дату занятий нет.</p>
            ) : (
              <div className="space-y-3">
                {lessonsForDate.map((lesson) => (
                  <Card key={lesson.id} className="border-[#0033A0]/10">
                    <CardContent className="p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{lesson.subject.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(lesson.startsAt), "HH:mm")} - {format(new Date(lesson.endsAt), "HH:mm")}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <LessonType type={lesson.lessonType} />
                            {lesson.gameType ? <Badge variant="secondary">{lesson.gameType}</Badge> : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingLesson(lesson)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Изменить
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm("Удалить занятие?")) {
                                deleteMutation.mutate(lesson.id)
                              }
                            }}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Удалить
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setUnlockLesson(lesson)}>
                            <Unlock className="mr-1 h-3.5 w-3.5" />
                            Разблокировать
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <Button variant="secondary" size="sm" onClick={() => toast.info("TODO: загрузка материалов")}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Добавить материалы
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toast.info("TODO: создание теста")}>
                          <ClipboardList className="mr-1 h-3.5 w-3.5" />
                          Создать тест
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => toast.info("TODO: создание лабораторной")}>
                          <Gamepad2 className="mr-1 h-3.5 w-3.5" />
                          Лабораторная / игра
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editingLesson)} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактирование занятия</DialogTitle>
          </DialogHeader>
          {editingLesson ? (
            <LessonForm
              subjects={subjects}
              initial={editingLesson}
              onSubmit={(data) => updateMutation.mutate({ lessonId: editingLesson.id, ...data })}
              isPending={updateMutation.isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(unlockLesson)} onOpenChange={(open) => !open && setUnlockLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Разблокировать занятие</DialogTitle>
          </DialogHeader>
          {unlockLesson ? (
            <UnlockForm
              onSubmit={(data) => unlockMutation.mutate({ lessonId: unlockLesson.id, ...data })}
              isPending={unlockMutation.isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LessonForm({
  subjects,
  initial,
  onSubmit,
  isPending,
}: {
  subjects: { id: string; name: string }[]
  initial?: Partial<AdminLesson>
  onSubmit: (data: {
    subjectId: string
    lessonType: string
    gameType?: string
    startsAt: string
    endsAt: string
  }) => void
  isPending: boolean
}) {
  const [subjectId, setSubjectId] = useState(initial?.subject?.id ?? "")
  const [lessonType, setLessonType] = useState(initial?.lessonType ?? "LECTURE")
  const [gameType, setGameType] = useState(initial?.gameType ?? "")
  const [startsAt, setStartsAt] = useState(
    initial?.startsAt ? toLocalDateTime(initial.startsAt) : ""
  )
  const [endsAt, setEndsAt] = useState(
    initial?.endsAt ? toLocalDateTime(initial.endsAt) : ""
  )

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Предмет</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите предмет" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Тип занятия</Label>
        <Select value={lessonType} onValueChange={setLessonType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LESSON_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lessonType === "LAB_GAME" ? (
        <div className="space-y-1">
          <Label>Тип игры</Label>
          <Select value={gameType} onValueChange={setGameType}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите игру" />
            </SelectTrigger>
            <SelectContent>
              {GAME_TYPES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Начало</Label>
          <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Конец</Label>
          <Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
        </div>
      </div>

      <Button
        className="w-full bg-[#0033A0] hover:bg-[#002A84]"
        onClick={() => onSubmit({ subjectId, lessonType, gameType: gameType || undefined, startsAt, endsAt })}
        disabled={isPending || !subjectId || !startsAt || !endsAt || (lessonType === "LAB_GAME" && !gameType)}
      >
        {isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </div>
  )
}

function UnlockForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: { studentId: string; reason: string }) => void
  isPending: boolean
}) {
  const [studentId, setStudentId] = useState("")
  const [reason, setReason] = useState("Занятие завершилось и требует повторного доступа")

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>ID студента</Label>
        <Input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="UUID студента" />
      </div>
      <div className="space-y-1">
        <Label>Причина</Label>
        <Input value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>
      <Button
        className="w-full bg-[#0033A0] hover:bg-[#002A84]"
        onClick={() => onSubmit({ studentId, reason })}
        disabled={isPending || !studentId || !reason}
      >
        {isPending ? "Отправка..." : "Разблокировать"}
      </Button>
    </div>
  )
}
