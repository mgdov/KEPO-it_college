"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Cell = null | { color: "r" | "b"; king: boolean }
type Board = Cell[][]

function initCheckers(): Board {
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => {
      if ((r + c) % 2 === 1) {
        if (r < 3) return { color: "b" as const, king: false }
        if (r > 4) return { color: "r" as const, king: false }
      }
      return null
    })
  )
}

interface Props {
  sessionId: string
  onFinish: (winner: string, score?: number) => void
}

export function CheckersGame({ sessionId, onFinish }: Props) {
  const [board, setBoard] = useState<Board>(initCheckers)
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [turn, setTurn] = useState<"r" | "b">("r")
  const [gameOver, setGameOver] = useState(false)

  const countPieces = (b: Board, color: "r" | "b") =>
    b.flat().filter((c) => c?.color === color).length

  const handleClick = useCallback(
    (r: number, c: number) => {
      if (gameOver) return
      const cell = board[r][c]
      if (selected) {
        const [sr, sc] = selected
        if (sr === r && sc === c) { setSelected(null); return }
        if (cell?.color === turn) { setSelected([r, c]); return }

        const dr = r - sr
        const dc = c - sc
        const piece = board[sr][sc]
        if (!piece) { setSelected(null); return }

        const dirs = piece.king
          ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
          : turn === "r"
          ? [[-1, -1], [-1, 1]]
          : [[1, -1], [1, 1]]

        const isSimpleMove = dirs.some(([dr2, dc2]) => dr === dr2 && dc === dc2) && !cell
        const isCapture =
          Math.abs(dr) === 2 &&
          Math.abs(dc) === 2 &&
          dirs.some(([dr2, dc2]) => Math.sign(dr) === Math.sign(dr2) && Math.sign(dc) === Math.sign(dc2)) &&
          !cell &&
          board[sr + dr / 2][sc + dc / 2]?.color === (turn === "r" ? "b" : "r")

        if (!isSimpleMove && !isCapture) { setSelected(null); return }

        const newBoard = board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
        newBoard[r][c] = { ...piece }
        newBoard[sr][sc] = null
        if (isCapture) newBoard[sr + dr / 2][sc + dc / 2] = null

        // King promotion
        if (r === 0 && turn === "r") newBoard[r][c]!.king = true
        if (r === 7 && turn === "b") newBoard[r][c]!.king = true

        const nextTurn: "r" | "b" = turn === "r" ? "b" : "r"
        const remaining = countPieces(newBoard, nextTurn)
        if (remaining === 0) {
          setBoard(newBoard)
          setGameOver(true)
          onFinish(turn === "r" ? "red" : "black", 10)
          return
        }

        setBoard(newBoard)
        setSelected(null)
        setTurn(nextTurn)
      } else {
        if (cell?.color === turn) setSelected([r, c])
      }
    },
    [board, selected, turn, gameOver, onFinish]
  )

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="border-2 border-border rounded-md overflow-hidden shadow-lg">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1
              const isSelected = selected?.[0] === r && selected?.[1] === c
              return (
                <button
                  key={c}
                  onClick={() => handleClick(r, c)}
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center transition-colors",
                    isDark ? "bg-amber-800" : "bg-amber-100",
                    isSelected && "ring-2 ring-inset ring-yellow-400",
                    isDark && !gameOver && "hover:brightness-110 cursor-pointer"
                  )}
                  aria-label={`Square ${r},${c}`}
                >
                  {cell && (
                    <div className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow",
                      cell.color === "r"
                        ? "bg-red-500 border-red-700 text-white"
                        : "bg-slate-800 border-slate-600 text-white"
                    )}>
                      {cell.king ? "♛" : ""}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className={cn(
          "h-5 w-5 rounded-full border-2 border-border shadow",
          turn === "r" ? "bg-red-500" : "bg-slate-800"
        )} />
        <span className="text-sm font-medium text-foreground">
          {gameOver ? "Игра завершена!" : turn === "r" ? "Ход красных" : "Ход чёрных"}
        </span>
        {!gameOver && (
          <Button variant="outline" size="sm" onClick={() => { setGameOver(true); onFinish("draw") }}>
            Сдаться
          </Button>
        )}
      </div>
    </div>
  )
}
