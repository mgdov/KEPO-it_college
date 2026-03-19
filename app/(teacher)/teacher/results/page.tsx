"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import { BarChart2, Users, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

export default function TeacherResultsPage() {
  const [groupId, setGroupId] = useState<string>("")
  const [subjectId, setSubjectId] = useState<string>("")

  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: admin.groups,
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: admin.subjects,
  })

  const { data: groupResults } = useQuery({
    queryKey: ["admin", "results", "group", groupId],
    queryFn: () => admin.resultsByGroup(groupId),
    enabled: !!groupId,
  })
  const { data: subjectResults } = useQuery({
    queryKey: ["admin", "results", "subject", subjectId],
    queryFn: () => admin.resultsBySubject(subjectId),
    enabled: !!subjectId,
  })

  function renderResults(data: unknown) {
    if (!data) {
      return (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Выберите группу или предмет для отображения результатов
        </div>
      )
    }

    const rows = Array.isArray(data)
      ? data
      : typeof data === "object" && data !== null
      ? Object.entries(data).map(([k, v]) => ({ name: k, ...(typeof v === "object" ? v as object : { value: v }) }))
      : []

    if (!rows.length) {
      return (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Нет данных
        </div>
      )
    }

    const chartData = rows.slice(0, 20).map((row: Record<string, unknown>, i) => ({
      name: (row.name as string) ?? (row.fullName as string) ?? `#${i + 1}`,
      score: typeof row.score === "number" ? row.score : typeof row.average === "number" ? row.average : 0,
      maxScore: typeof row.maxScore === "number" ? row.maxScore : 100,
    }))

    return (
      <div className="space-y-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => {
                const pct = entry.maxScore > 0 ? entry.score / entry.maxScore : 0
                const color =
                  pct >= 0.8
                    ? "hsl(142 76% 36%)"
                    : pct >= 0.6
                    ? "hsl(38 92% 50%)"
                    : "hsl(0 84% 60%)"
                return <Cell key={index} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Студент / Занятие</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Балл</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Макс.</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chartData.map((row, i) => {
                const pct = row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0
                return (
                  <tr key={i} className="hover:bg-accent transition-colors">
                    <td className="py-2 px-3 text-foreground">{row.name}</td>
                    <td className="py-2 px-3 text-right font-medium text-foreground">{row.score}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{row.maxScore}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${
                      pct >= 80 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Результаты</h1>
        <p className="text-sm text-muted-foreground">Статистика успеваемости студентов</p>
      </div>

      <Tabs defaultValue="group">
        <TabsList>
          <TabsTrigger value="group" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            По группе
          </TabsTrigger>
          <TabsTrigger value="subject" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            По предмету
          </TabsTrigger>
        </TabsList>

        <TabsContent value="group" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Результаты по группе
                </CardTitle>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {renderResults(groupResults)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subject" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Результаты по предмету
                </CardTitle>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Выберите предмет" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {renderResults(subjectResults)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
