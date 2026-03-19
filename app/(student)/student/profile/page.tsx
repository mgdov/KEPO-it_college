"use client"

import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import { useMe } from "@/lib/hooks/use-auth"
import { User, GraduationCap, Mail, BookOpen, Hash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export default function ProfilePage() {
  const { data: me } = useMe()
  const { data: profile, isLoading } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: student.profile,
  })
  const { data: grades = [] } = useQuery({
    queryKey: ["student", "grades"],
    queryFn: student.grades,
  })

  const totalScore = grades.reduce((s, g) => s + g.score, 0)
  const totalMax = grades.reduce((s, g) => s + g.maxScore, 0)
  const performance = totalMax ? Math.round((totalScore / totalMax) * 100) : 0

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-xl font-bold">Мой профиль</h2>

      {/* Avatar card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {profile ? getInitials(profile.fullName) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">{profile?.fullName}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {profile?.email}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span>Логин: <span className="text-foreground font-medium">{profile?.login}</span></span>
              </div>
              <Badge className="mt-1 bg-primary/10 text-primary border-0">Студент</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Данные об обучении
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Группа" value={profile?.student?.group?.name ?? "—"} />
            <InfoRow label="Курс" value={profile?.student?.group?.course ? `${profile.student.group.course} курс` : "—"} />
            <InfoRow label="Специальность" value={profile?.student?.group?.specialty ?? "—"} className="sm:col-span-2" />
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Успеваемость
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Общий показатель</span>
            <span className={`text-lg font-bold ${
              performance >= 80
                ? "text-green-600 dark:text-green-400"
                : performance >= 60
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {performance}%
            </span>
          </div>
          <Progress value={performance} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Набрано баллов: {totalScore}</span>
            <span>Максимум: {totalMax}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`space-y-0.5 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
