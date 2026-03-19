"use client"

import { useEffect, useMemo, useState } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Mode = "vsComputer" | "pvp"

interface Props {
  mode: Mode
  difficulty: "easy" | "medium" | "hard"
  onFinish: (winner: string) => void
}

function pickRandomMove(chess: Chess) {
  const moves = chess.moves()
  if (!moves.length) return null
  return moves[Math.floor(Math.random() * moves.length)]
}

function pickMoveByDifficulty(chess: Chess, difficulty: "easy" | "medium" | "hard") {
  if (difficulty === "easy") return pickRandomMove(chess)

  const moves = chess.moves({ verbose: true })
  if (!moves.length) return null

  const scored = moves.map((m) => {
    let score = 0
    if (m.captured) score += 40
    if (m.promotion) score += 30
    if (m.flags.includes("k") || m.flags.includes("q")) score += 10
    if (m.san.includes("+")) score += 15
    if (m.san.includes("#")) score += 999
    return { move: m.san, score }
  })

  scored.sort((a, b) => b.score - a.score)

  if (difficulty === "hard") {
    return scored[0].move
  }

  const pool = scored.slice(0, Math.min(4, scored.length))
  return pool[Math.floor(Math.random() * pool.length)].move
}

export function ChessProGame({ mode, difficulty, onFinish }: Props) {
  const [chess, setChess] = useState(() => new Chess())
  const [lastMove, setLastMove] = useState<string | null>(null)
  const [boardWidth, setBoardWidth] = useState(560)

  const fen = chess.fen()
  const turn = chess.turn() === "w" ? "Белые" : "Черные"

  const status = useMemo(() => {
    if (chess.isCheckmate()) return "Мат"
    if (chess.isDraw()) return "Ничья"
    if (chess.isCheck()) return "Шах"
    return "Игра идет"
  }, [chess])

  useEffect(() => {
    if (mode !== "vsComputer") return
    if (chess.turn() !== "b") return
    if (chess.isGameOver()) return

    const timer = setTimeout(() => {
      const next = new Chess(chess.fen())
      const move = pickMoveByDifficulty(next, difficulty)
      if (!move) return
      next.move(move)
      setChess(next)
      setLastMove(move)
    }, difficulty === "hard" ? 350 : difficulty === "medium" ? 550 : 800)

    return () => clearTimeout(timer)
  }, [chess, mode, difficulty])

  useEffect(() => {
    function updateBoardWidth() {
      const viewport = typeof window !== "undefined" ? window.innerWidth : 1024
      const max = Math.min(560, viewport - 64)
      setBoardWidth(Math.max(280, max))
    }

    updateBoardWidth()
    window.addEventListener("resize", updateBoardWidth)
    return () => window.removeEventListener("resize", updateBoardWidth)
  }, [])

  useEffect(() => {
    if (!chess.isGameOver()) return

    if (chess.isDraw()) {
      onFinish("draw")
      return
    }

    const winner = chess.turn() === "w" ? "black" : "white"
    onFinish(winner)
  }, [chess, onFinish])

  function onDrop(sourceSquare: string, targetSquare: string) {
    const next = new Chess(chess.fen())

    if (mode === "vsComputer" && next.turn() !== "w") return false

    try {
      const move = next.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      })
      if (!move) return false
      setChess(next)
      setLastMove(move.san)
      return true
    } catch {
      return false
    }
  }

  function resetGame() {
    setChess(new Chess())
    setLastMove(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Ход: {turn}</Badge>
        <Badge variant="outline">Статус: {status}</Badge>
        {lastMove ? <Badge variant="secondary">Последний ход: {lastMove}</Badge> : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <Chessboard
          options={{
            id: "kepo-chess-pro",
            position: fen,
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (!targetSquare) return false
              return onDrop(sourceSquare, targetSquare)
            },
            boardStyle: { borderRadius: "12px", maxWidth: `${boardWidth}px` },
            darkSquareStyle: { backgroundColor: "#0033A0" },
            lightSquareStyle: { backgroundColor: "#DCE8FF" },
            allowDragging: !chess.isGameOver(),
            animationDurationInMs: 220,
          }}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={resetGame}>
          Новая партия
        </Button>
      </div>
    </div>
  )
}
