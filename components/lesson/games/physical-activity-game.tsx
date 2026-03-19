"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type Difficulty = "easy" | "medium" | "hard"

interface Props {
  difficulty: Difficulty
  onFinish: (winner: string) => void
}

interface Drill {
  id: string
  title: string
  icon: string
  tip: string
}

const DRILLS: Drill[] = [
  { id: "squats", title: "Приседания", icon: "🏋️", tip: "Спина ровная, пятки на полу" },
  { id: "jumps", title: "Прыжки", icon: "🦘", tip: "Мягко приземляйтесь на носок" },
  { id: "dance", title: "Танец", icon: "💃", tip: "Улыбка и ритм важнее скорости" },
  { id: "yoga", title: "Йога-поза", icon: "🧘", tip: "Дышите спокойно и глубоко" },
  { id: "stretch", title: "Растяжка", icon: "🤸", tip: "Без резких движений" },
]

const DIFFICULTY_RULES: Record<Difficulty, { seconds: number; rounds: number }> = {
  easy: { seconds: 14, rounds: 5 },
  medium: { seconds: 11, rounds: 5 },
  hard: { seconds: 8, rounds: 5 },
}

export function PhysicalActivityGame({ difficulty, onFinish }: Props) {
  const [started, setStarted] = useState(false)
  const [roundIndex, setRoundIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DIFFICULTY_RULES[difficulty].seconds)
  const [completed, setCompleted] = useState(0)

  const rules = DIFFICULTY_RULES[difficulty]
  const active = DRILLS[roundIndex]

  useEffect(() => {
    setStarted(false)
    setRoundIndex(0)
    setCompleted(0)
    setSecondsLeft(rules.seconds)
  }, [difficulty, rules.seconds])

  useEffect(() => {
    if (!started) return
    if (secondsLeft <= 0) {
      if (roundIndex >= rules.rounds - 1) {
        onFinish("player")
        return
      }
      setRoundIndex((prev) => prev + 1)
      setCompleted((prev) => prev + 1)
      setSecondsLeft(rules.seconds)
      return
    }

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, started, roundIndex, rules.rounds, rules.seconds, onFinish])

  const progress = useMemo(() => {
    const done = Math.min(completed + (started ? 1 : 0), rules.rounds)
    return (done / rules.rounds) * 100
  }, [completed, rules.rounds, started])

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-foreground">Физминутка с персонажем КЭПО</h4>
          <Badge variant="outline">Раунд {Math.min(roundIndex + 1, rules.rounds)} / {rules.rounds}</Badge>
        </div>
        <div className="mt-3">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-[#0033A0]/25 bg-linear-to-br from-[#EAF0FF] to-white p-6"
          >
            <div className="text-6xl">{active.icon}</div>
            <p className="mt-3 text-xl font-bold text-[#0033A0]">{active.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{active.tip}</p>
            <div className="mt-5 text-sm text-[#0033A0]">
              Двигайтесь в комфортном темпе. Таймер автоматически переведет вас к следующему упражнению.
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Осталось времени</p>
            <p className="text-4xl font-extrabold text-[#0033A0]">{secondsLeft}s</p>
          </div>

          {!started ? (
            <Button className="w-full bg-[#0033A0] hover:bg-[#002A84]" onClick={() => setStarted(true)}>
              Начать физминутку
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStarted(false)
                setRoundIndex(0)
                setCompleted(0)
                setSecondsLeft(rules.seconds)
              }}
            >
              Начать заново
            </Button>
          )}

          <div className="text-xs text-muted-foreground">
            Сложность влияет на время одного упражнения: легкая {DIFFICULTY_RULES.easy.seconds}s, средняя {DIFFICULTY_RULES.medium.seconds}s, сложная {DIFFICULTY_RULES.hard.seconds}s.
          </div>
        </div>
      </div>
    </div>
  )
}
