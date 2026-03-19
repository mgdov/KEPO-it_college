"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { admin, type AdminUser } from "@/lib/api"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { UserCheck, Users, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ROLE_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-600 border-0",
  STUDENT: "bg-blue-500/20 text-blue-600 border-0",
  TEACHER: "bg-emerald-500/20 text-emerald-600 border-0",
  ADMIN: "bg-purple-500/20 text-purple-600 border-0",
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [approveUser, setApproveUser] = useState<AdminUser | null>(null)
  const [tab, setTab] = useState("all")

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["admin", "users", tab === "pending" ? "PENDING" : undefined],
    queryFn: () => admin.users(tab === "pending" ? "PENDING" : undefined),
  })
  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: admin.groups,
  })

  const approveMutation = useMutation({
    mutationFn: ({ userId, groupId }: { userId: string; groupId: string }) =>
      admin.approve(userId, groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      setApproveUser(null)
      toast.success("Пользователь подтверждён")
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const filtered = allUsers.filter((u) =>
    `${u.fullName} ${u.email} ${u.login ?? ""}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Пользователи</h1>
          <p className="text-sm text-muted-foreground">Управление учётными записями</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-56"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1.5">
            Ожидают
            {allUsers.length > 0 && tab !== "pending" && (
              <Badge className="bg-amber-500 text-white border-0 text-xs ml-1">
                {allUsers.filter((u) => u.role === "PENDING").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">Пользователей нет</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{user.fullName}</p>
                          <Badge className={cn("text-xs", ROLE_COLORS[user.role])}>
                            {user.role}
                          </Badge>
                          {user.student?.group && (
                            <Badge variant="outline" className="text-xs">
                              {user.student.group.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span>{user.email}</span>
                          {user.login && <span>· Логин: {user.login}</span>}
                          <span>· {format(new Date(user.createdAt), "d MMM yyyy", { locale: ru })}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {user.role === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => setApproveUser(user)}
                          className="flex items-center gap-1.5 flex-shrink-0"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Подтвердить
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve dialog */}
      <Dialog open={!!approveUser} onOpenChange={(o) => !o && setApproveUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердить студента</DialogTitle>
          </DialogHeader>
          {approveUser && (
            <ApproveForm
              user={approveUser}
              groups={groups}
              isPending={approveMutation.isPending}
              onSubmit={(groupId) => approveMutation.mutate({ userId: approveUser.id, groupId })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApproveForm({
  user,
  groups,
  isPending,
  onSubmit,
}: {
  user: AdminUser
  groups: { id: string; name: string; course: number; specialty: string }[]
  isPending: boolean
  onSubmit: (groupId: string) => void
}) {
  const [groupId, setGroupId] = useState("")

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-secondary p-4">
        <p className="font-semibold text-foreground">{user.fullName}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="space-y-1.5">
        <Label>Назначить в группу</Label>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите группу" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name} — {g.specialty} ({g.course} курс)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        onClick={() => onSubmit(groupId)}
        disabled={isPending || !groupId}
      >
        {isPending ? "Подтверждение..." : "Подтвердить и назначить"}
      </Button>
    </div>
  )
}
