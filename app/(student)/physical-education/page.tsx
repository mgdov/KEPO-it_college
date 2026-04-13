"use client"

import { useQuery } from "@tanstack/react-query"
import { PhysicalEducationHub } from "@/components/lesson/physical-education-hub"
import { student } from "@/lib/api"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function PhysicalEducationPage() {
  const from = dateOffset(-30)
  const to = dateOffset(30)

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["student", "schedule", from, to],
    queryFn: () => student.schedule(from, to),
  })

  const gameLesson =
    lessons.find((l) => l.lessonType === "LAB_GAME" && !l.isLocked) ??
    lessons.find((l) => l.lessonType === "LAB_GAME")

  if (isLoading) {
    return <div className="max-w-7xl mx-auto text-sm text-muted-foreground">Загрузка...</div>
  }

  if (!gameLesson) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4 text-center">
        <p className="text-muted-foreground">В расписании пока нет доступных LAB_GAME занятий.</p>
        <Button asChild variant="outline">
          <Link href="/student/schedule">Перейти в расписание</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PhysicalEducationHub lessonId={gameLesson.id} title="Полноценный модуль ЛЗ по физкультуре" />
    </div>
  )
}
