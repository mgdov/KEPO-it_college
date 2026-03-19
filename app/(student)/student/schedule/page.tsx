"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import Link from "next/link"
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, isSameDay, isToday
} from "date-fns"
import { ru } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LessonTypeBadge } from "../page"

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const now = new Date()
  const baseWeek = addWeeks(now, weekOffset)
  const weekStart = startOfWeek(baseWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(baseWeek, { weekStartsOn: 1 })
  const from = format(weekStart, "yyyy-MM-dd")
  const to = format(weekEnd, "yyyy-MM-dd")

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ["student", "schedule", from, to],
    queryFn: () => student.schedule(from, to),
  })

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Расписание занятий</h2>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-[#0033A0] hover:bg-[#002A84]">
            <Link href="/courses">Начать учёбу</Link>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((p) => p - 1)} aria-label="Предыдущая неделя">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {format(weekStart, "d MMM", { locale: ru })} – {format(weekEnd, "d MMM yyyy", { locale: ru })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((p) => p + 1)} aria-label="Следующая неделя">
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Сегодня
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {days.slice(0, 5).map((day) => {
            const dayLessons = schedule.filter((l) =>
              isSameDay(new Date(l.startsAt), day)
            )
            const isCurrentDay = isToday(day)

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "flex flex-col",
                  isCurrentDay && "border-primary/50 ring-1 ring-primary/20"
                )}
              >
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      isCurrentDay ? "text-primary" : "text-muted-foreground"
                    )}>
                      {format(day, "EEE", { locale: ru })}
                    </span>
                    <span className={cn(
                      "text-lg font-bold",
                      isCurrentDay
                        ? "h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm"
                        : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 flex-1 space-y-2">
                  {dayLessons.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 text-center py-3">—</p>
                  ) : (
                    dayLessons.map((lesson) => {
                      const isPast = new Date(lesson.endsAt) < now
                      const locked = lesson.isLocked && !lesson.isUnlocked
                      return (
                        <Link
                          key={lesson.id}
                          href={locked ? "#" : `/student/lessons/${lesson.id}`}
                          className={cn(
                            "block rounded-md p-2 text-xs transition-colors border",
                            locked
                              ? "opacity-50 cursor-not-allowed bg-muted border-border"
                              : isPast && !isCurrentDay
                                ? "bg-muted/50 border-border hover:bg-muted"
                                : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                          )}
                          onClick={locked ? (e) => e.preventDefault() : undefined}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-foreground/80">
                              {format(new Date(lesson.startsAt), "HH:mm")}
                            </span>
                            {locked ? (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            ) : isPast ? (
                              <Unlock className="h-3 w-3 text-green-500" />
                            ) : null}
                          </div>
                          <p className="font-medium text-foreground truncate leading-tight">
                            {lesson.subject.name}
                          </p>
                          <div className="mt-1">
                            <LessonTypeBadge type={lesson.lessonType} />
                          </div>
                        </Link>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Weekend */}
      {days.length > 5 && (
        <div className="grid grid-cols-2 gap-3">
          {days.slice(5).map((day) => {
            const dayLessons = schedule.filter((l) =>
              isSameDay(new Date(l.startsAt), day)
            )
            return (
              <Card key={day.toISOString()} className="opacity-60">
                <CardContent className="px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(day, "EEEE, d MMM", { locale: ru })}
                  </span>
                  {dayLessons.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {dayLessons.length} занятий
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* List view */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Список на неделю</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Занятий на эту неделю нет</p>
          ) : (
            <div className="space-y-2">
              {schedule.map((lesson) => {
                const locked = lesson.isLocked && !lesson.isUnlocked
                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border",
                      locked ? "opacity-50 bg-muted" : "bg-card hover:bg-accent transition-colors"
                    )}
                  >
                    <div className="text-xs text-muted-foreground text-right w-20 flex-shrink-0">
                      <div>{format(new Date(lesson.startsAt), "EEE d MMM", { locale: ru })}</div>
                      <div className="font-medium text-foreground">
                        {format(new Date(lesson.startsAt), "HH:mm")} – {format(new Date(lesson.endsAt), "HH:mm")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lesson.subject.name}</p>
                      <LessonTypeBadge type={lesson.lessonType} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {locked ? (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Закрыто
                        </Badge>
                      ) : (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/student/lessons/${lesson.id}`}>Открыть</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
