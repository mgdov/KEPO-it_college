"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { admin, type AdminLesson } from "@/lib/api"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Plus, Trash2, Upload, FileText, Lock, Unlock, Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { LessonTypeBadge } from "@/app/(student)/student/page"
import { toast } from "sonner"

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
  { value: "WORD", label: "Угадай слово" },
  { value: "MILLIONAIRE", label: "Миллионер" },
  { value: "REACTION", label: "Реакция" },
]

export default function TeacherLessonsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState<string | null>(null)
  const [materialOpen, setMaterialOpen] = useState<string | null>(null)

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: () => admin.lessons(),
  })
  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: admin.groups,
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: admin.subjects,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => admin.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "lessons"] })
      toast.success("Занятие удалено")
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const filtered = lessons.filter((l) =>
    `${l.subject.name} ${l.group.name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Занятия</h1>
          <p className="text-sm text-muted-foreground">Управление занятиями и материалами</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-52"
            />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Создать
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Новое занятие</DialogTitle>
              </DialogHeader>
              <CreateLessonForm
                groups={groups}
                subjects={subjects}
                onSuccess={() => {
                  setCreateOpen(false)
                  qc.invalidateQueries({ queryKey: ["admin", "lessons"] })
                  toast.success("Занятие создано")
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Занятий не найдено
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex flex-col items-center text-xs text-muted-foreground w-20 flex-shrink-0">
                    <span className="font-medium text-foreground">
                      {format(new Date(lesson.startsAt), "d MMM", { locale: ru })}
                    </span>
                    <span>
                      {format(new Date(lesson.startsAt), "HH:mm")} – {format(new Date(lesson.endsAt), "HH:mm")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground truncate">{lesson.subject.name}</p>
                      <LessonTypeBadge type={lesson.lessonType} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lesson.group.name} · {lesson.subject.code}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Materials */}
                    <Dialog open={materialOpen === lesson.id} onOpenChange={(o) => setMaterialOpen(o ? lesson.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Upload className="h-3.5 w-3.5" />
                          Материалы
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Материалы занятия</DialogTitle>
                        </DialogHeader>
                        <MaterialsManager lessonId={lesson.id} />
                      </DialogContent>
                    </Dialog>

                    {/* Unlock */}
                    <Dialog open={unlockOpen === lesson.id} onOpenChange={(o) => setUnlockOpen(o ? lesson.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Unlock className="h-3.5 w-3.5" />
                          Разблокировать
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Разблокировать занятие</DialogTitle>
                        </DialogHeader>
                        <UnlockForm
                          lessonId={lesson.id}
                          onSuccess={() => {
                            setUnlockOpen(null)
                            toast.success("Занятие разблокировано")
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Удалить занятие?")) deleteMutation.mutate(lesson.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateLessonForm({
  groups,
  subjects,
  onSuccess,
}: {
  groups: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    groupId: "",
    subjectId: "",
    lessonType: "LECTURE",
    gameType: "",
    startsAt: "",
    endsAt: "",
  })

  const mutation = useMutation({
    mutationFn: () =>
      admin.createLesson({
        groupId: form.groupId,
        subjectId: form.subjectId,
        lessonType: form.lessonType,
        gameType: form.gameType || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }),
    onSuccess,
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Группа</Label>
        <Select value={form.groupId} onValueChange={(v) => setForm((p) => ({ ...p, groupId: v }))}>
          <SelectTrigger><SelectValue placeholder="Выберите группу" /></SelectTrigger>
          <SelectContent>
            {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Предмет</Label>
        <Select value={form.subjectId} onValueChange={(v) => setForm((p) => ({ ...p, subjectId: v }))}>
          <SelectTrigger><SelectValue placeholder="Выберите предмет" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Тип занятия</Label>
        <Select value={form.lessonType} onValueChange={(v) => setForm((p) => ({ ...p, lessonType: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {LESSON_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {form.lessonType === "LAB_GAME" && (
        <div className="space-y-1.5">
          <Label>Тип игры</Label>
          <Select value={form.gameType} onValueChange={(v) => setForm((p) => ({ ...p, gameType: v }))}>
            <SelectTrigger><SelectValue placeholder="Выберите игру" /></SelectTrigger>
            <SelectContent>
              {GAME_TYPES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Начало</Label>
          <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Конец</Label>
          <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} />
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.groupId || !form.subjectId || !form.startsAt || !form.endsAt}
      >
        {mutation.isPending ? "Создание..." : "Создать занятие"}
      </Button>
    </div>
  )
}

function MaterialsManager({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient()
  const { data: materials = [] } = useQuery({
    queryKey: ["admin", "materials", lessonId],
    queryFn: () => admin.materials(lessonId),
  })

  const uploadMutation = useMutation({
    mutationFn: (form: FormData) => admin.uploadMaterial(lessonId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "materials", lessonId] })
      toast.success("Файл загружен")
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => admin.deleteMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "materials", lessonId] }),
    onError: (e) => toast.error((e as Error).message),
  })

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const title = prompt("Название материала:", file.name.replace(/\.[^.]+$/, ""))
    if (!title) return
    const fd = new FormData()
    fd.append("file", file)
    fd.append("title", title)
    uploadMutation.mutate(fd)
    e.target.value = ""
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="mat-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 border border-dashed border-border rounded-lg p-4 hover:bg-accent transition-colors text-sm text-muted-foreground">
            <Upload className="h-4 w-4 flex-shrink-0" />
            {uploadMutation.isPending ? "Загрузка..." : "Нажмите для загрузки файла"}
          </div>
          <Input
            id="mat-upload"
            type="file"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploadMutation.isPending}
          />
        </Label>
      </div>

      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Материалов нет</p>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded border border-border">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground uppercase">{m.fileType}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(m.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UnlockForm({
  lessonId,
  onSuccess,
}: {
  lessonId: string
  onSuccess: () => void
}) {
  const [studentId, setStudentId] = useState("")
  const [reason, setReason] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      admin.unlockLesson(lessonId, {
        studentId,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    onSuccess,
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>ID студента</Label>
        <Input
          placeholder="UUID студента"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Причина</Label>
        <Input
          placeholder="Причина разблокировки"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Срок действия (опционально)</Label>
        <Input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !studentId || !reason}
      >
        {mutation.isPending ? "Разблокировка..." : "Разблокировать"}
      </Button>
    </div>
  )
}
