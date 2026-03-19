"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { admin } from "@/lib/api"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const PAGE_SIZE = 20

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit", page],
    queryFn: () => admin.auditLogs({ page, pageSize: PAGE_SIZE }),
  })

  const logs = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const ACTION_COLOR: Record<string, string> = {
    CREATE: "bg-green-500/20 text-green-600 border-0",
    UPDATE: "bg-blue-500/20 text-blue-600 border-0",
    DELETE: "bg-red-500/20 text-red-600 border-0",
    APPROVE: "bg-emerald-500/20 text-emerald-600 border-0",
    LOGIN: "bg-purple-500/20 text-purple-600 border-0",
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Журнал аудита</h1>
        <p className="text-sm text-muted-foreground">История действий в системе</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Последние действия
            {total > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({total} всего)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Записей нет
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Время</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Пользователь</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Действие</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Сущность</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent transition-colors">
                      <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), "d MMM HH:mm", { locale: ru })}
                      </td>
                      <td className="py-2 px-2 font-medium text-foreground text-xs">
                        {log.actorName}
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={`text-xs ${ACTION_COLOR[log.action] ?? "bg-muted text-muted-foreground border-0"}`}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {log.entityType}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground font-mono hidden sm:table-cell">
                        {log.entityId.slice(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Страница {page} из {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
