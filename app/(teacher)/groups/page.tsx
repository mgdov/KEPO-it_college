"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import { useMe } from "@/lib/hooks/use-auth"
import { Users, CalendarDays, Plus, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TeacherGroupsPage() {
  const { data: me } = useMe()
  const [search, setSearch] = useState("")
  const [studentsGroupId, setStudentsGroupId] = useState<string | null>(null)

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["admin", "groups", "teacher", me?.id],
    // TODO: connect to real API endpoint /api/admin/groups?teacherId=...
    queryFn: () => admin.groupsByTeacher(me?.id as string),
    enabled: Boolean(me?.id),
  })

  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: ["admin", "groups", studentsGroupId, "students"],
    // TODO: connect to real API endpoint /api/admin/groups/:groupId/students
    queryFn: () => admin.groupStudents(studentsGroupId as string),
    enabled: Boolean(studentsGroupId),
  })

  const filtered = groups.filter((group) => {
    const haystack = `${group.name} ${group.specialty} ${group.course}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  if (error) {
    return (
      <Card className="max-w-3xl mx-auto border-red-300">
        <CardContent className="py-10 text-center space-y-2">
          <p className="text-lg font-semibold">Не удалось загрузить группы</p>
          <p className="text-sm text-muted-foreground">Проверьте доступ к API и повторите попытку.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <Card className="overflow-hidden border-[#0033A0]/20">
        <CardContent className="bg-linear-to-r from-[#0033A0] to-[#1147b8] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Кабинет преподавателя</p>
              <h1 className="text-2xl font-bold">Группы</h1>
              <p className="text-sm text-white/80">Таблица групп преподавателя с быстрыми действиями.</p>
            </div>
            <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm">
              <Users className="mr-2 h-4 w-4" />
              {groups.length} групп
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Список групп</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по группе"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Группа</TableHead>
                  <TableHead>Курс</TableHead>
                  <TableHead>Специальность</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Группы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.course}</TableCell>
                      <TableCell>{group.specialty}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/groups/${group.id}/schedule`}>
                              <CalendarDays className="mr-1 h-4 w-4" />
                              Просмотреть расписание
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/groups/${group.id}/schedule?create=1`}>
                              <Plus className="mr-1 h-4 w-4" />
                              Добавить занятие
                            </Link>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setStudentsGroupId(group.id)}
                          >
                            Студенты группы
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(studentsGroupId)} onOpenChange={(open) => !open && setStudentsGroupId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Студенты группы</DialogTitle>
          </DialogHeader>

          {studentsLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-10 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : studentsError ? (
            <p className="text-sm text-red-600">Не удалось загрузить список студентов.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Студентов нет
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.login ?? "-"}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
