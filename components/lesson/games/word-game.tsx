"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const WORDS = [
  "АЛГОРИТМ", "ПРОГРАММА", "КОМПИЛЯТОР", "ПЕРЕМЕННАЯ", "ФУНКЦИЯ",
  "МАССИВ", "ЦИКЛ", "УСЛОВИЕ", "ОПЕРАТОР", "ПРОЦЕССОР",
  "ИНТЕРФЕЙС", "БИБЛИОТЕКА", "РЕКУРСИЯ", "КОНСТАНТА", "СТРУКТУРА",
]

const KEYBOARD_ROWS = [
  ["Й","Ц","У","К","Е","Н","Г","Ш","Щ","З","Х"],
  ["Ф","Ы","В","А","П","Р","О","Л","Д","Ж","Э"],
  ["Я","Ч","С","М","И","Т","Ь","Б","Ю"],
]

const MAX_WRONG = 6

interface Props {
  sessionId: string
  onFinish: (winner: string, score?: number) => void
}

export function WordGame({ sessionId, onFinish }: Props) {
  const [word, setWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)])
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing")

  const wrongLetters = [...guessed].filter((l) => !word.includes(l))
  const wrongCount = wrongLetters.length
  const revealed = word.split("").filter((l) => guessed.has(l))

  useEffect(() => {
    if (wrongCount >= MAX_WRONG) {
      setPhase("lost")
      onFinish("computer", 0)
    } else if (word.split("").every((l) => guessed.has(l))) {
      setPhase("won")
      onFinish("player", Math.max(100 - wrongCount * 10, 10))
    }
  }, [guessed, word, wrongCount, onFinish])

  function guess(letter: string) {
    if (phase !== "playing" || guessed.has(letter)) return
    setGuessed((p) => new Set([...p, letter]))
  }

  function restart() {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)])
    setGuessed(new Set())
    setPhase("playing")
  }

  // Hangman SVG
  const HangmanSVG = () => (
    <svg viewBox="0 0 100 120" className="h-32 w-24" aria-hidden="true">
      {/* Gallows */}
      <line x1="10" y1="115" x2="90" y2="115" stroke="currentColor" strokeWidth="3" />
      <line x1="30" y1="115" x2="30" y2="5" stroke="currentColor" strokeWidth="3" />
      <line x1="30" y1="5" x2="65" y2="5" stroke="currentColor" strokeWidth="3" />
      <line x1="65" y1="5" x2="65" y2="20" stroke="currentColor" strokeWidth="3" />
      {/* Head */}
      {wrongCount >= 1 && <circle cx="65" cy="28" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />}
      {/* Body */}
      {wrongCount >= 2 && <line x1="65" y1="36" x2="65" y2="70" stroke="currentColor" strokeWidth="2.5" />}
      {/* Left arm */}
      {wrongCount >= 3 && <line x1="65" y1="45" x2="48" y2="58" stroke="currentColor" strokeWidth="2.5" />}
      {/* Right arm */}
      {wrongCount >= 4 && <line x1="65" y1="45" x2="82" y2="58" stroke="currentColor" strokeWidth="2.5" />}
      {/* Left leg */}
      {wrongCount >= 5 && <line x1="65" y1="70" x2="50" y2="90" stroke="currentColor" strokeWidth="2.5" />}
      {/* Right leg */}
      {wrongCount >= 6 && <line x1="65" y1="70" x2="80" y2="90" stroke="currentColor" strokeWidth="2.5" />}
    </svg>
  )

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Hangman */}
      <div className="text-muted-foreground">
        <HangmanSVG />
      </div>

      {/* Wrong count */}
      <div className="flex items-center gap-2">
        <Badge variant={wrongCount >= MAX_WRONG ? "destructive" : "outline"}>
          Ошибок: {wrongCount} / {MAX_WRONG}
        </Badge>
        {phase === "won" && <Badge className="bg-green-500 text-white border-0">Победа!</Badge>}
        {phase === "lost" && <Badge className="bg-red-500 text-white border-0">Проигрыш!</Badge>}
      </div>

      {/* Word display */}
      <div className="flex gap-2 flex-wrap justify-center">
        {word.split("").map((letter, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className={cn(
              "text-2xl font-bold w-8 text-center",
              guessed.has(letter) || phase === "lost" ? "text-foreground" : "text-transparent"
            )}>
              {letter}
            </span>
            <div className={cn(
              "h-0.5 w-7",
              guessed.has(letter) ? "bg-primary" : phase === "lost" ? "bg-red-500" : "bg-muted-foreground"
            )} />
          </div>
        ))}
      </div>

      {/* Wrong letters */}
      {wrongLetters.length > 0 && (
        <p className="text-sm text-red-500">
          Неверные: {wrongLetters.join(", ")}
        </p>
      )}

      {/* Keyboard */}
      <div className="space-y-2">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1 justify-center">
            {row.map((letter) => {
              const used = guessed.has(letter)
              const correct = word.includes(letter) && used
              const wrong = !word.includes(letter) && used
              return (
                <button
                  key={letter}
                  onClick={() => guess(letter)}
                  disabled={used || phase !== "playing"}
                  className={cn(
                    "h-9 w-9 rounded text-sm font-medium transition-colors border",
                    correct && "bg-green-500 text-white border-green-600",
                    wrong && "bg-red-200 text-red-400 border-red-300 dark:bg-red-900/30 dark:text-red-400",
                    !used && phase === "playing" && "bg-card hover:bg-accent border-border text-foreground",
                    !used && phase !== "playing" && "opacity-50"
                  )}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {phase !== "playing" && (
        <Button onClick={restart} variant="outline">
          Играть снова
        </Button>
      )}
    </div>
  )
}
