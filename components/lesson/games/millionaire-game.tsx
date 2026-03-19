"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Trophy, PhoneCall, Users, Split } from "lucide-react"

interface Question {
  text: string
  options: [string, string, string, string]
  correct: number
}

const QUESTIONS: Question[] = [
  {
    text: "Какой язык программирования используется для разработки веб-страниц на стороне клиента?",
    options: ["Python", "JavaScript", "Java", "C++"],
    correct: 1,
  },
  {
    text: "Что означает аббревиатура HTML?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyper Transfer Markup Links",
      "Home Tool Markup Language",
    ],
    correct: 0,
  },
  {
    text: "Какой протокол используется для передачи веб-страниц?",
    options: ["FTP", "SMTP", "HTTP", "TCP"],
    correct: 2,
  },
  {
    text: "Что такое алгоритм?",
    options: [
      "Тип данных",
      "Пошаговая инструкция для решения задачи",
      "Программный язык",
      "База данных",
    ],
    correct: 1,
  },
  {
    text: "Какая структура данных работает по принципу LIFO?",
    options: ["Очередь", "Массив", "Стек", "Дерево"],
    correct: 2,
  },
  {
    text: "Что такое рекурсия?",
    options: [
      "Тип цикла",
      "Метод сортировки",
      "Функция, вызывающая саму себя",
      "Тип переменной",
    ],
    correct: 2,
  },
  {
    text: "Сколько бит в одном байте?",
    options: ["4", "8", "16", "32"],
    correct: 1,
  },
  {
    text: "Какой оператор используется для сравнения в большинстве языков?",
    options: ["=", ":=", "==", "!="],
    correct: 2,
  },
  {
    text: "Что возвращает функция без оператора return в Python?",
    options: ["0", "False", "None", "Ошибку"],
    correct: 2,
  },
  {
    text: "Как называется процесс нахождения и исправления ошибок в коде?",
    options: ["Компиляция", "Отладка (Debugging)", "Рефакторинг", "Тестирование"],
    correct: 1,
  },
]

const PRIZES = [
  "100", "200", "300", "500", "1 000",
  "2 000", "4 000", "8 000", "16 000", "32 000",
]

const LETTERS = ["А", "Б", "В", "Г"]

interface Props {
  sessionId: string
  onFinish: (winner: string, score?: number) => void
}

export function MillionaireGame({ sessionId, onFinish }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<"question" | "correct" | "wrong" | "won">("question")
  const [hintsUsed, setHintsUsed] = useState<Set<string>>(new Set())
  const [eliminated, setEliminated] = useState<number[]>([])

  const q = QUESTIONS[current]
  const prize = PRIZES[current]

  function choose(idx: number) {
    if (phase !== "question" || eliminated.includes(idx)) return
    setSelected(idx)
    if (idx === q.correct) {
      setPhase("correct")
    } else {
      setPhase("wrong")
      setTimeout(() => onFinish("computer", current * 100), 1500)
    }
  }

  function next() {
    if (current === QUESTIONS.length - 1) {
      setPhase("won")
      onFinish("player", 1000)
      return
    }
    setCurrent((p) => p + 1)
    setSelected(null)
    setEliminated([])
    setPhase("question")
  }

  function use5050() {
    if (hintsUsed.has("5050")) return
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.correct)
    const toElim = wrong.sort(() => 0.5 - Math.random()).slice(0, 2)
    setEliminated(toElim)
    setHintsUsed((p) => new Set([...p, "5050"]))
  }

  if (phase === "won") {
    return (
      <div className="text-center py-10 space-y-4">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
        <h3 className="text-2xl font-bold text-foreground">Поздравляем!</h3>
        <p className="text-muted-foreground">Вы ответили на все вопросы и выиграли миллион!</p>
        <Badge className="text-lg px-4 py-1 bg-yellow-500 text-white border-0">1 000 000 ₽</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Вопрос {current + 1} из {QUESTIONS.length}</span>
        <span className="font-semibold text-foreground">{prize} ₽</span>
      </div>
      <Progress value={((current + 1) / QUESTIONS.length) * 100} className="h-1.5" />

      {/* Prize ladder mini */}
      <div className="flex gap-1 flex-wrap justify-center">
        {PRIZES.map((p, i) => (
          <span key={i} className={cn(
            "text-xs px-1.5 py-0.5 rounded",
            i === current ? "bg-primary text-primary-foreground font-bold" :
            i < current ? "bg-green-500/20 text-green-600" :
            "bg-muted text-muted-foreground"
          )}>
            {p}
          </span>
        ))}
      </div>

      {/* Hints */}
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={use5050}
          disabled={hintsUsed.has("5050") || phase !== "question"}
          className={cn("flex items-center gap-1 text-xs", hintsUsed.has("5050") && "opacity-40")}
        >
          <Split className="h-3.5 w-3.5" />
          50:50
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="flex items-center gap-1 text-xs opacity-40"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Звонок другу
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="flex items-center gap-1 text-xs opacity-40"
        >
          <Users className="h-3.5 w-3.5" />
          Помощь зала
        </Button>
      </div>

      {/* Question */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 text-center">
        <p className="font-semibold text-foreground leading-relaxed">{q.text}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          const isElim = eliminated.includes(i)
          const isSelected = selected === i
          const isCorrect = i === q.correct

          let variant: string = "outline"
          if (phase === "correct" && isCorrect) variant = "correct"
          if (phase === "wrong" && isSelected) variant = "wrong"
          if (phase === "wrong" && isCorrect) variant = "correct"

          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={isElim || phase !== "question"}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all font-medium",
                isElim && "opacity-20 cursor-not-allowed",
                phase === "question" && !isElim && "hover:bg-accent border-border bg-card",
                variant === "correct" && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300",
                variant === "wrong" && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300",
                variant === "outline" && !isElim && "bg-card border-border"
              )}
            >
              <span className="font-bold text-muted-foreground shrink-0">{LETTERS[i]}:</span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      {phase === "correct" && (
        <div className="text-center space-y-2">
          <p className="text-green-600 font-semibold">Правильно! +{prize} ₽</p>
          <Button onClick={next}>
            {current === QUESTIONS.length - 1 ? "Забрать выигрыш!" : "Следующий вопрос"}
          </Button>
        </div>
      )}
    </div>
  )
}
