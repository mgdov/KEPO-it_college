"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

type Phase = "idle" | "waiting" | "ready" | "clicked" | "done"

const ROUNDS = 5

interface Props {
  sessionId: string
  onFinish: (winner: string, score?: number) => void
}

export function ReactionGame({ sessionId, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [times, setTimes] = useState<number[]>([])
  const [current, setCurrent] = useState<number | null>(null)
  const [tooEarly, setTooEarly] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<number>(0)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const startWaiting = useCallback(() => {
    setPhase("waiting")
    setTooEarly(false)
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => {
      setPhase("ready")
      startRef.current = performance.now()
    }, delay)
  }, [])

  function handleClick() {
    if (phase === "idle") return
    if (phase === "waiting") {
      clearTimer()
      setTooEarly(true)
      setPhase("idle")
      return
    }
    if (phase === "ready") {
      const elapsed = Math.round(performance.now() - startRef.current)
      setCurrent(elapsed)
      const newTimes = [...times, elapsed]
      setTimes(newTimes)
      if (newTimes.length >= ROUNDS) {
        setPhase("done")
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
        // Score: faster = better; 200ms = 100 pts, 500ms = 50 pts
        const score = Math.max(10, Math.round(100 - (avg - 200) / 3))
        onFinish("player", score)
      } else {
        setPhase("clicked")
      }
    }
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  const avg = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null

  const phaseColors: Record<string, string> = {
    idle: "bg-slate-200 dark:bg-slate-700",
    waiting: "bg-red-500",
    ready: "bg-green-500",
    clicked: "bg-blue-500",
    done: "bg-primary",
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Тест на реакцию</h3>
        <Badge variant="outline">Раунд {Math.min(times.length + 1, ROUNDS)} / {ROUNDS}</Badge>
      </div>

      {/* Big button */}
      <button
        onClick={handleClick}
        className={cn(
          "h-48 w-48 rounded-full text-white font-bold text-lg shadow-xl transition-all duration-150 select-none",
          phaseColors[phase],
          phase === "ready" && "scale-105 animate-pulse",
          phase !== "idle" && "cursor-pointer"
        )}
        aria-label="Reaction button"
      >
        {phase === "idle" && "Начать"}
        {phase === "waiting" && "Ждите..."}
        {phase === "ready" && "ЖМИ!"}
        {phase === "clicked" && current !== null && `${current} мс`}
        {phase === "done" && "Готово!"}
      </button>

      {tooEarly && (
        <p className="text-red-500 text-sm font-medium">Слишком рано! Нажмите снова.</p>
      )}

      {/* Timing history */}
      {times.length > 0 && (
        <div className="space-y-2 w-full max-w-xs">
          <div className="flex flex-wrap gap-2 justify-center">
            {times.map((t, i) => (
              <Badge key={i} variant="secondary">{t} мс</Badge>
            ))}
          </div>
          {avg && (
            <p className="text-center text-sm text-muted-foreground">
              Среднее:{" "}
              <span className={cn(
                "font-bold",
                avg < 250 ? "text-green-600" : avg < 400 ? "text-amber-600" : "text-red-600"
              )}>
                {avg} мс
              </span>
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      {(phase === "idle" || phase === "clicked") && !tooEarly && (
        <Button onClick={startWaiting}>
          {times.length === 0 ? "Начать" : "Следующий раунд"}
        </Button>
      )}
      {tooEarly && (
        <Button onClick={startWaiting} variant="outline">
          Попробовать снова
        </Button>
      )}

      {phase === "done" && (
        <div className="text-center space-y-1">
          <p className="font-semibold text-foreground">
            Среднее время реакции: <span className="text-primary">{avg} мс</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {avg! < 250 ? "Отличная реакция!" : avg! < 400 ? "Хорошая реакция" : "Продолжайте тренироваться"}
          </p>
        </div>
      )}
    </div>
  )
}
