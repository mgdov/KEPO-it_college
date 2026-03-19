"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function AdminSubjectsPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<{ id: string; name: string; code: string } | null>(null)

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: admin.subjects,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => admin.deleteSubject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subjects"] })
      toast.success("Предмет удалён")
    },
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Предметы</h1>
          <p className="text-sm text-muted-foreground">Учебные дисциплины</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Добавить предмет</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый предмет</DialogTitle></DialogHeader>
            <SubjectForm
              onSuccess={() => {
                setCreateOpen(false)
                qc.invalidateQueries({ queryKey: ["admin", "subjects"] })
                toast.success("Предмет добавлен")
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Предметов нет</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:bg-accent transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono flex-shrink-0">{subject.code}</Badge>
                    </div>
                    <p className="font-medium text-foreground mt-1 truncate">{subject.name}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => setEditSubject(subject)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Удалить предмет "${subject.name}"?`)) deleteMutation.mutate(subject.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editSubject} onOpenChange={(o) => !o && setEditSubject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать предмет</DialogTitle></DialogHeader>
          {editSubject && (
            <SubjectForm
              initial={editSubject}
              onSuccess={() => {
                setEditSubject(null)
                qc.invalidateQueries({ queryKey: ["admin", "subjects"] })
                toast.success("Предмет обновлён")
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubjectForm({
  initial,
  onSuccess,
}: {
  initial?: { id: string; name: string; code: string }
  onSuccess: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [code, setCode] = useState(initial?.code ?? "")

  const mutation = useMutation({
    mutationFn: () => {
      return initial
        ? admin.updateSubject(initial.id, { name, code })
        : admin.createSubject({ name, code })
    },
    onSuccess,
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Код предмета</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ИТ.01" />
      </div>
      <div className="space-y-1.5">
        <Label>Название предмета</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Информационные технологии" />
      </div>
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !name || !code}
      >
        {mutation.isPending ? "Сохранение..." : initial ? "Сохранить" : "Создать"}
      </Button>
    </div>
  )
}
