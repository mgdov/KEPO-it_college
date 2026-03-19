"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function AdminGroupsPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<{ id: string; name: string; course: number; specialty: string } | null>(null)

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: admin.groups,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => admin.deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "groups"] })
      toast.success("Группа удалена")
    },
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Группы</h1>
          <p className="text-sm text-muted-foreground">Управление учебными группами</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Создать группу</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новая группа</DialogTitle></DialogHeader>
            <GroupForm
              onSuccess={() => {
                setCreateOpen(false)
                qc.invalidateQueries({ queryKey: ["admin", "groups"] })
                toast.success("Группа создана")
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Групп нет. Создайте первую.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:bg-accent transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{group.name}</p>
                      <Badge variant="secondary" className="text-xs">{group.course} курс</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{group.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setEditGroup(group)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Удалить группу "${group.name}"?`)) {
                          deleteMutation.mutate(group.id)
                        }
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

      {/* Edit dialog */}
      <Dialog open={!!editGroup} onOpenChange={(o) => !o && setEditGroup(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать группу</DialogTitle></DialogHeader>
          {editGroup && (
            <GroupForm
              initial={editGroup}
              onSuccess={() => {
                setEditGroup(null)
                qc.invalidateQueries({ queryKey: ["admin", "groups"] })
                toast.success("Группа обновлена")
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupForm({
  initial,
  onSuccess,
}: {
  initial?: { id: string; name: string; course: number; specialty: string }
  onSuccess: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [course, setCourse] = useState(String(initial?.course ?? "1"))
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "")

  const mutation = useMutation({
    mutationFn: () => {
      const data = { name, course: Number(course), specialty }
      return initial
        ? admin.updateGroup(initial.id, data)
        : admin.createGroup(data)
    },
    onSuccess,
    onError: (e) => toast.error((e as Error).message),
  })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Название группы</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ИТ-21" />
      </div>
      <div className="space-y-1.5">
        <Label>Специальность</Label>
        <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Информационные технологии" />
      </div>
      <div className="space-y-1.5">
        <Label>Курс</Label>
        <Input type="number" min={1} max={6} value={course} onChange={(e) => setCourse(e.target.value)} />
      </div>
      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !name || !specialty}
      >
        {mutation.isPending ? "Сохранение..." : initial ? "Сохранить" : "Создать"}
      </Button>
    </div>
  )
}
