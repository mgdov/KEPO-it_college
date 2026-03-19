"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { games } from "@/lib/api"
import { Gamepad2, Users, Computer, Trophy, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChessGame } from "./games/chess-game"
import { CheckersGame } from "./games/checkers-game"
import { WordGame } from "./games/word-game"
import { MillionaireGame } from "./games/millionaire-game"
import { ReactionGame } from "./games/reaction-game"
import { PhysicalEducationHub } from "@/components/lesson/physical-education-hub"

const GAME_META: Record<string, { label: string; description: string; emoji: string }> = {
  CHESS: { label: "Шахматы", description: "Классическая стратегическая игра", emoji: "♟" },
  CHECKERS: { label: "Шашки", description: "Традиционная игра на клетчатой доске", emoji: "⬛" },
  WORD: { label: "Угадай слово", description: "Угадайте скрытое слово по буквам", emoji: "🔤" },
  MILLIONAIRE: { label: "Кто хочет стать миллионером?", description: "Ответьте на 15 вопросов", emoji: "💰" },
  REACTION: { label: "Реакция", description: "Проверьте скорость реакции", emoji: "⚡" },
  physical: { label: "Физкультура", description: "Полноценный игровой модуль", emoji: "🏃" },
  PHYSICAL: { label: "Физкультура", description: "Полноценный игровой модуль", emoji: "🏃" },
}

interface Props {
  lessonId: string
  gameType: string
}

type Mode = "menu" | "vs-computer" | "pvp-create" | "pvp-join" | "playing"

export function GameModule({ lessonId, gameType }: Props) {
  if (gameType === "physical" || gameType === "PHYSICAL") {
    return <PhysicalEducationHub lessonId={lessonId} title="Лабораторная по физкультуре" />
  }

  const qc = useQueryClient()
  const [mode, setMode] = useState<Mode>("menu")
  const [sessionId, setSessionId] = useState<string | null>(null)

  const meta = GAME_META[gameType] ?? { label: gameType, description: "", emoji: "🎮" }

  const { data: pvpSessions = [] } = useQuery({
    queryKey: ["pvp", "open", lessonId],
    queryFn: () => games.openPvp(lessonId),
    enabled: mode === "pvp-join",
    refetchInterval: 3000,
  })

  const createVsComputerMutation = useMutation({
    mutationFn: () => games.createSession(lessonId, gameType),
    onSuccess: (s) => {
      setSessionId(s.id)
      setMode("playing")
    },
  })

  const createPvpMutation = useMutation({
    mutationFn: () => games.createPvp(lessonId, gameType),
    onSuccess: (s) => {
      setSessionId(s.id)
      setMode("playing")
    },
  })

  const joinPvpMutation = useMutation({
    mutationFn: (sid: string) => games.joinPvp(sid),
    onSuccess: (s) => {
      setSessionId(s.id)
      setMode("playing")
    },
  })

  function handleFinish(winner: string, score?: number) {
    if (!sessionId) return
    games.finish(sessionId, winner, score)
    qc.invalidateQueries({ queryKey: ["student", "grades"] })
    setMode("menu")
    setSessionId(null)
  }

  if (mode === "playing" && sessionId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-xl">{meta.emoji}</span>
              {meta.label}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                games.cancel(sessionId).catch(() => { })
                setMode("menu")
                setSessionId(null)
              }}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" /> Выйти
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gameType === "CHESS" && (
            <ChessGame sessionId={sessionId} onFinish={handleFinish} />
          )}
          {gameType === "CHECKERS" && (
            <CheckersGame sessionId={sessionId} onFinish={handleFinish} />
          )}
          {gameType === "WORD" && (
            <WordGame sessionId={sessionId} onFinish={handleFinish} />
          )}
          {gameType === "MILLIONAIRE" && (
            <MillionaireGame sessionId={sessionId} onFinish={handleFinish} />
          )}
          {gameType === "REACTION" && (
            <ReactionGame sessionId={sessionId} onFinish={handleFinish} />
          )}
        </CardContent>
      </Card>
    )
  }

  if (mode === "pvp-join") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Присоединиться к игре</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setMode("menu")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pvpSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Нет открытых игр. Попробуйте позже.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => qc.invalidateQueries({ queryKey: ["pvp", "open", lessonId] })}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Обновить
              </Button>
            </div>
          ) : (
            pvpSessions.map((s: { id: string; player1Id?: string; createdAt: string }) => (
              <div key={s.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">Игрок ищет соперника</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleTimeString("ru")}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => joinPvpMutation.mutate(s.id)}
                  disabled={joinPvpMutation.isPending}
                >
                  Войти
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gamepad2 className="h-5 w-5 text-primary" />
          {meta.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary p-4 flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{meta.emoji}</span>
          <div>
            <p className="font-medium text-foreground">{meta.label}</p>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            onClick={() => createVsComputerMutation.mutate()}
            disabled={createVsComputerMutation.isPending}
            className="flex flex-col h-auto py-4 gap-2"
          >
            <Computer className="h-6 w-6" />
            <span className="text-sm font-semibold">Играть с компьютером</span>
          </Button>

          <div className="grid grid-rows-2 gap-2">
            <Button
              variant="outline"
              onClick={() => createPvpMutation.mutate()}
              disabled={createPvpMutation.isPending}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Создать PvP-игру
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("pvp-join")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Найти игру
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
