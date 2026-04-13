"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { games, type DifficultyLevel } from "@/lib/api"
import { useMe } from "@/lib/hooks/use-auth"
import { toast } from "sonner"
import {
  Trophy,
  Dumbbell,
  Medal,
  Flame,
  Gamepad2,
  UserRound,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChessProGame } from "@/components/lesson/games/chess-pro-game"
import { CheckersGame } from "@/components/lesson/games/checkers-game"
import { WordGame } from "@/components/lesson/games/word-game"
import { MillionaireGame } from "@/components/lesson/games/millionaire-game"
import { PhysicalActivityGame } from "@/components/lesson/games/physical-activity-game"

type Mode = "vsComputer" | "pvp"
type GameKey = "CHESS" | "CHECKERS" | "WORD" | "MILLIONAIRE" | "PHYSICAL"

interface PhysicalRatingRow {
  userId: string
  userName: string
  points: number
  matches: number
  wins: number
  updatedAt: string
}

const RATING_KEY = "kepo_physical_rating_v1"

const GAME_ITEMS: {
  key: GameKey
  apiType: string
  title: string
  subtitle: string
  icon: React.ReactNode
}[] = [
    {
      key: "CHESS",
      apiType: "CHESS",
      title: "Шахматы",
      subtitle: "chess.js + react-chessboard",
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      key: "CHECKERS",
      apiType: "CHECKERS",
      title: "Шашки (русские)",
      subtitle: "Классическая тактическая дуэль",
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      key: "WORD",
      apiType: "WORD",
      title: "Умная игра слов",
      subtitle: "Лексика, скорость и внимание",
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      key: "MILLIONAIRE",
      apiType: "MILLIONAIRE",
      title: "Кто хочет стать миллионером",
      subtitle: "15 вопросов + lifelines",
      icon: <Gamepad2 className="h-4 w-4" />,
    },
    {
      key: "PHYSICAL",
      apiType: "physical",
      title: "Физминутка для детей",
      subtitle: "Анимации движений + таймер",
      icon: <Dumbbell className="h-4 w-4" />,
    },
  ]

const DIFFICULTY_META: Record<DifficultyLevel, { label: string; multiplier: number }> = {
  easy: { label: "Легкая", multiplier: 1 },
  medium: { label: "Средняя", multiplier: 1.6 },
  hard: { label: "Сложная", multiplier: 2.4 },
}

function playTone(freq: number, duration = 0.12) {
  if (typeof window === "undefined") return
  const audio = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
  if (!audio) return
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = "sine"
  oscillator.frequency.value = freq
  oscillator.connect(gain)
  gain.connect(audio.destination)

  gain.gain.setValueAtTime(0.02, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  oscillator.start(audio.currentTime)
  oscillator.stop(audio.currentTime + duration)
}

function computePoints(result: "win" | "draw" | "lose", difficulty: DifficultyLevel, durationSec: number) {
  const speedBoost = Math.max(0, 90 - Math.min(durationSec, 90))
  const mult = DIFFICULTY_META[difficulty].multiplier

  if (result === "win") {
    const points = Math.round((100 + speedBoost) * mult)
    return Math.min(300, Math.max(100, points))
  }

  if (result === "draw") {
    const points = Math.round((25 + speedBoost * 0.25) * mult)
    return Math.min(50, Math.max(30, points))
  }

  const points = Math.round((20 + speedBoost * 0.15) * mult)
  return Math.min(45, Math.max(20, points))
}

function readRating(): PhysicalRatingRow[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RATING_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as PhysicalRatingRow[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function writeRating(rows: PhysicalRatingRow[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(RATING_KEY, JSON.stringify(rows))
}

export function PhysicalEducationHub({
  lessonId,
  title = "Физкультура: интерактивный модуль",
}: {
  lessonId: string
  title?: string
}) {
  const qc = useQueryClient()
  const { data: me } = useMe()

  const [selectedGame, setSelectedGame] = useState<GameKey>("CHESS")
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("easy")
  const [mode, setMode] = useState<Mode>("vsComputer")
  const [soundOn, setSoundOn] = useState(true)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const selectedMeta = useMemo(
    () => GAME_ITEMS.find((item) => item.key === selectedGame) ?? GAME_ITEMS[0],
    [selectedGame]
  )

  const { data: rating = [] } = useQuery({
    queryKey: ["physical", "rating"],
    // TODO: connect to real API endpoint /api/games/rating?category=physical
    queryFn: async () => readRating().sort((a, b) => b.points - a.points),
  })

  const { data: openPvp = [] } = useQuery({
    queryKey: ["games", "pvp", "open", lessonId],
    // TODO: connect to real API endpoint /api/games/pvp
    queryFn: () => games.openPvp(lessonId),
    enabled: mode === "pvp" && !activeSessionId,
    refetchInterval: 5000,
  })

  const createSessionMutation = useMutation({
    mutationFn: () => games.createSession(lessonId, selectedMeta.apiType),
    onSuccess: (session) => {
      setActiveSessionId(session.id)
      setStartedAt(Date.now())
      if (soundOn) playTone(460)
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const createPvpMutation = useMutation({
    mutationFn: () => games.createPvp(lessonId, selectedMeta.apiType),
    onSuccess: (session) => {
      setActiveSessionId(session.id)
      setStartedAt(Date.now())
      toast.success("PvP-сессия создана")
      if (soundOn) playTone(520)
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const joinPvpMutation = useMutation({
    mutationFn: (sessionId: string) => games.joinPvp(sessionId),
    onSuccess: (session) => {
      setActiveSessionId(session.id)
      setStartedAt(Date.now())
      toast.success("Вы присоединились к PvP")
      if (soundOn) playTone(520)
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const finishMutation = useMutation({
    mutationFn: (params: {
      sessionId: string
      winner: string
      score: number
      difficulty: DifficultyLevel
      mode: Mode
      durationSeconds: number
    }) =>
      games.finish(params.sessionId, params.winner, params.score, {
        points: params.score,
        difficulty: params.difficulty,
        mode: params.mode,
        durationSeconds: params.durationSeconds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "grades"] })
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const myRow = rating.find((row) => row.userId === me?.id)

  function upsertRating(points: number, isWin: boolean) {
    if (!me) return

    const current = readRating()
    const existing = current.find((entry) => entry.userId === me.id)

    const next: PhysicalRatingRow = existing
      ? {
        ...existing,
        points: existing.points + points,
        wins: existing.wins + (isWin ? 1 : 0),
        matches: existing.matches + 1,
        updatedAt: new Date().toISOString(),
      }
      : {
        userId: me.id,
        userName: me.fullName,
        points,
        wins: isWin ? 1 : 0,
        matches: 1,
        updatedAt: new Date().toISOString(),
      }

    const nextRows = [...current.filter((entry) => entry.userId !== me.id), next].sort(
      (a, b) => b.points - a.points
    )

    writeRating(nextRows)
    qc.setQueryData(["physical", "rating"], nextRows)
  }

  function handleGameFinish(winner: string) {
    if (!activeSessionId) return

    const durationSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 30

    const result: "win" | "draw" | "lose" =
      winner === "draw"
        ? "draw"
        : winner === "player" || winner === "white" || winner === "red"
          ? "win"
          : "lose"

    const points = computePoints(result, difficulty, durationSeconds)

    finishMutation.mutate({
      sessionId: activeSessionId,
      winner,
      score: points,
      difficulty,
      mode,
      durationSeconds,
    })

    upsertRating(points, result === "win")

    if (soundOn) {
      if (result === "win") playTone(660)
      if (result === "draw") playTone(520)
      if (result === "lose") playTone(280)
    }

    toast.success(`Игра завершена. Получено ${points} баллов.`)

    setActiveSessionId(null)
    setStartedAt(null)
  }

  const activeGame = activeSessionId ? (
    <Card className="border-[#0033A0]/25">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{selectedMeta.title}</CardTitle>
          <Badge className="bg-[#0033A0] text-white">
            {DIFFICULTY_META[difficulty].label} · {mode === "pvp" ? "PvP" : "vs Компьютер"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {selectedGame === "CHESS" ? (
          <ChessProGame mode={mode} difficulty={difficulty} onFinish={handleGameFinish} />
        ) : null}
        {selectedGame === "CHECKERS" ? (
          <CheckersGame sessionId={activeSessionId} onFinish={handleGameFinish} />
        ) : null}
        {selectedGame === "WORD" ? (
          <WordGame sessionId={activeSessionId} onFinish={handleGameFinish} />
        ) : null}
        {selectedGame === "MILLIONAIRE" ? (
          <MillionaireGame sessionId={activeSessionId} onFinish={handleGameFinish} />
        ) : null}
        {selectedGame === "PHYSICAL" ? (
          <PhysicalActivityGame difficulty={difficulty} onFinish={handleGameFinish} />
        ) : null}
      </CardContent>
    </Card>
  ) : null

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[#0033A0]/20">
        <CardContent className="bg-linear-to-r from-[#0033A0] to-[#1147b8] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">КЭПО · Физкультура</p>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-white/80">5 игровых направлений, сложность, PvP и рейтинговые очки.</p>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-[#0033A0] hover:bg-white/90"
              onClick={() => setSoundOn((prev) => !prev)}
            >
              {soundOn ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
              {soundOn ? "Звук включен" : "Звук выключен"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {GAME_ITEMS.map((game, index) => (
          <motion.button
            key={game.key}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            onClick={() => setSelectedGame(game.key)}
            className={
              "rounded-xl border p-4 text-left transition-all " +
              (selectedGame === game.key
                ? "border-[#0033A0] bg-[#0033A0]/5 shadow-md"
                : "border-border bg-card hover:border-[#0033A0]/40")
            }
          >
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0]">
              {game.icon}
            </div>
            <p className="font-semibold text-foreground">{game.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{game.subtitle}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Параметры занятия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Сложность</p>
                <Tabs
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(value as DifficultyLevel)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="easy">Легкая</TabsTrigger>
                    <TabsTrigger value="medium">Средняя</TabsTrigger>
                    <TabsTrigger value="hard">Сложная</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Режим</p>
                <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="vsComputer">
                      <UserRound className="mr-1 h-4 w-4" />
                      vs Компьютер
                    </TabsTrigger>
                    <TabsTrigger value="pvp">
                      <Users className="mr-1 h-4 w-4" />
                      PvP
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {mode === "vsComputer" ? (
                <Button
                  className="w-full bg-[#0033A0] hover:bg-[#002A84]"
                  onClick={() => createSessionMutation.mutate()}
                  disabled={createSessionMutation.isPending || Boolean(activeSessionId)}
                >
                  <Flame className="mr-2 h-4 w-4" />
                  {createSessionMutation.isPending ? "Подготовка..." : "Начать игру"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-[#0033A0] hover:bg-[#002A84]"
                    onClick={() => createPvpMutation.mutate()}
                    disabled={createPvpMutation.isPending || Boolean(activeSessionId)}
                  >
                    Создать PvP-комнату
                  </Button>

                  <div className="rounded-lg border border-border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">Открытые PvP-сессии</p>
                    <div className="space-y-2">
                      {openPvp.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Сессий пока нет.</p>
                      ) : (
                        openPvp.slice(0, 5).map((session: { id: string; gameType?: string; createdAt: string }) => (
                          <div key={session.id} className="flex items-center justify-between gap-2 rounded border border-border p-2 text-xs">
                            <div>
                              <p className="font-medium">{session.gameType ?? "Игра"}</p>
                              <p className="text-muted-foreground">{new Date(session.createdAt).toLocaleTimeString("ru-RU")}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => joinPvpMutation.mutate(session.id)}
                              disabled={joinPvpMutation.isPending || Boolean(activeSessionId)}
                            >
                              Войти
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {activeGame}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Medal className="h-4 w-4 text-[#0033A0]" />
                Мой рейтинг по физкультуре
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-[#0033A0]/20 bg-[#0033A0]/5 p-3 text-sm">
                <p className="font-medium text-foreground">{me?.fullName ?? "Студент"}</p>
                <p className="text-muted-foreground">
                  Баллы: <span className="font-semibold text-[#0033A0]">{myRow?.points ?? 0}</span>
                </p>
                <p className="text-muted-foreground">
                  Побед: <span className="font-semibold">{myRow?.wins ?? 0}</span> · Матчей: <span className="font-semibold">{myRow?.matches ?? 0}</span>
                </p>
              </div>

              <div className="mt-3 rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Студент</TableHead>
                      <TableHead>Баллы</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rating.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Рейтинг пуст
                        </TableCell>
                      </TableRow>
                    ) : (
                      rating.slice(0, 10).map((row, index) => (
                        <TableRow key={row.userId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.userName}</TableCell>
                          <TableCell>{row.points}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#0033A0]" />
                Система баллов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Победа: 100-300 баллов (сложность + время).</p>
              <p>Ничья / поражение: 20-50 баллов.</p>
              <p>
                После завершения сессии отправляется:
                <code className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">POST /api/games/sessions/finish</code>
              </p>
              <p className="text-xs">stats: {`{ points, difficulty, mode, durationSeconds }`}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
