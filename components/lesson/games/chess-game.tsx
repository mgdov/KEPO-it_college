"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PieceType = "K" | "Q" | "R" | "B" | "N" | "P"
type Color = "w" | "b"
type Piece = { type: PieceType; color: Color } | null
type Board = Piece[][]

const PIECE_UNICODE: Record<PieceType, Record<Color, string>> = {
  K: { w: "♔", b: "♚" },
  Q: { w: "♕", b: "♛" },
  R: { w: "♖", b: "♜" },
  B: { w: "♗", b: "♝" },
  N: { w: "♘", b: "♞" },
  P: { w: "♙", b: "♟" },
}

function initBoard(): Board {
  const empty = (): Board =>
    Array.from({ length: 8 }, () => Array(8).fill(null))
  const b = empty()
  const backRow: PieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"]
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: backRow[c], color: "b" }
    b[1][c] = { type: "P", color: "b" }
    b[6][c] = { type: "P", color: "w" }
    b[7][c] = { type: backRow[c], color: "w" }
  }
  return b
}

interface Props {
  sessionId: string
  onFinish: (winner: string, score?: number) => void
}

export function ChessGame({ sessionId, onFinish }: Props) {
  const [board, setBoard] = useState<Board>(initBoard)
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [turn, setTurn] = useState<Color>("w")
  const [status, setStatus] = useState<"playing" | "checkmate" | "draw">("playing")
  const [capturedW, setCapturedW] = useState<string[]>([])
  const [capturedB, setCapturedB] = useState<string[]>([])

  const handleSquare = useCallback(
    (r: number, c: number) => {
      if (status !== "playing") return
      const piece = board[r][c]
      if (selected) {
        const [sr, sc] = selected
        if (sr === r && sc === c) {
          setSelected(null)
          return
        }
        // If clicking own piece: re-select
        if (piece && piece.color === turn) {
          setSelected([r, c])
          return
        }
        // Move
        const newBoard = board.map((row) => row.slice())
        const moving = newBoard[sr][sc]
        if (!moving) { setSelected(null); return }
        // Capture tracking
        if (newBoard[r][c]) {
          const cap = newBoard[r][c]!
          const sym = PIECE_UNICODE[cap.type][cap.color]
          if (cap.color === "b") setCapturedB((p) => [...p, sym])
          else setCapturedW((p) => [...p, sym])
        }
        newBoard[r][c] = moving
        newBoard[sr][sc] = null
        // Pawn promotion
        if (moving.type === "P") {
          if (r === 0 && moving.color === "w") newBoard[r][c] = { type: "Q", color: "w" }
          if (r === 7 && moving.color === "b") newBoard[r][c] = { type: "Q", color: "b" }
        }
        setBoard(newBoard)
        setSelected(null)
        setTurn(turn === "w" ? "b" : "w")
      } else {
        if (piece && piece.color === turn) {
          setSelected([r, c])
        }
      }
    },
    [board, selected, turn, status]
  )

  const resign = () => {
    setStatus("checkmate")
    onFinish(turn === "w" ? "black" : "white", 0)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Captured by white */}
      <div className="text-xs text-muted-foreground h-5">
        {capturedB.join(" ")}
      </div>

      {/* Board */}
      <div className="border-2 border-border rounded-md overflow-hidden shadow-lg">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0
              const isSelected = selected?.[0] === r && selected?.[1] === c
              return (
                <button
                  key={c}
                  onClick={() => handleSquare(r, c)}
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-xl sm:text-2xl transition-colors select-none",
                    isLight ? "bg-amber-100" : "bg-amber-800",
                    isSelected && "ring-2 ring-inset ring-primary",
                    status === "playing" && "hover:brightness-110 cursor-pointer"
                  )}
                  aria-label={piece ? `${piece.color}${piece.type} at ${c}${r}` : `Square ${c}${r}`}
                >
                  {piece ? PIECE_UNICODE[piece.type][piece.color] : ""}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Captured by black */}
      <div className="text-xs text-muted-foreground h-5">
        {capturedW.join(" ")}
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-4 w-4 rounded-full border-2 border-border",
          turn === "w" ? "bg-white" : "bg-gray-900"
        )} />
        <span className="text-sm font-medium text-foreground">
          {status === "playing"
            ? turn === "w" ? "Ход белых" : "Ход чёрных"
            : "Игра завершена"}
        </span>
        {status === "playing" && (
          <Button variant="outline" size="sm" onClick={resign}>
            Сдаться
          </Button>
        )}
      </div>
    </div>
  )
}
