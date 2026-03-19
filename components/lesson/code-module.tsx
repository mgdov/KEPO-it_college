"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { programming } from "@/lib/api"
import {
  Play, Send, Terminal, CheckCircle, XCircle, AlertCircle,
  ChevronDown, Code2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const LANGUAGE_STARTERS: Record<string, string> = {
  python: `# Python\nprint("Hello, World!")`,
  javascript: `// JavaScript\nconsole.log("Hello, World!");`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
}

interface Props {
  lessonId: string
}

export function CodeModule({ lessonId }: Props) {
  const { data: task, isLoading } = useQuery({
    queryKey: ["prog", "task", lessonId],
    queryFn: () => programming.task(lessonId),
  })
  const { data: submissions = [] } = useQuery({
    queryKey: ["prog", "submissions", lessonId],
    queryFn: () => programming.submissions(lessonId),
  })

  const [language, setLanguage] = useState("python")
  const [code, setCode] = useState(LANGUAGE_STARTERS.python)
  const [stdin, setStdin] = useState("")
  const [runOutput, setRunOutput] = useState<{
    stdout?: string
    stderr?: string
    exitCode?: number
    time?: number
  } | null>(null)
  const [submitResult, setSubmitResult] = useState<{
    passed: number
    total: number
    results: { input: string; expected: string; actual: string; passed: boolean }[]
  } | null>(null)

  const runMutation = useMutation({
    mutationFn: () => programming.run(lessonId, code, language, stdin || undefined),
    onSuccess: (res) => setRunOutput(res),
  })

  const submitMutation = useMutation({
    mutationFn: () => programming.submit(lessonId, code, language),
    onSuccess: (res) => setSubmitResult(res),
  })

  const allowedLanguages = task?.allowedLanguages ?? Object.keys(LANGUAGE_STARTERS)

  function handleLanguageChange(lang: string) {
    setLanguage(lang)
    if (LANGUAGE_STARTERS[lang]) {
      setCode(LANGUAGE_STARTERS[lang])
    }
  }

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />
  }

  return (
    <div className="space-y-4">
      {/* Task description */}
      {task && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{task.statement}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                Язык: {task.allowedLanguages.join(", ")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Лимит времени: {task.timeLimitMs}мс
              </Badge>
              <Badge variant="outline" className="text-xs">
                Память: {task.memoryLimitKb}КБ
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Редактор кода
            </CardTitle>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedLanguages.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Code textarea (Monaco would be ideal but we'll use a styled textarea) */}
          <div className="relative rounded-lg overflow-hidden border border-border">
            <div className="bg-slate-900 text-slate-100 px-3 py-1.5 text-xs flex items-center gap-2 border-b border-slate-700">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="text-slate-400 ml-1">main.{language === "python" ? "py" : language === "javascript" ? "js" : language === "cpp" ? "cpp" : language === "java" ? "java" : language}</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full bg-slate-900 text-slate-100 font-mono text-sm p-4 resize-y min-h-[280px] focus:outline-none leading-relaxed"
              aria-label="Редактор кода"
              style={{ tabSize: 4 }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault()
                  const start = e.currentTarget.selectionStart
                  const end = e.currentTarget.selectionEnd
                  const newVal = code.substring(0, start) + "    " + code.substring(end)
                  setCode(newVal)
                  requestAnimationFrame(() => {
                    e.currentTarget.selectionStart = start + 4
                    e.currentTarget.selectionEnd = start + 4
                  })
                }
              }}
            />
          </div>

          {/* Stdin */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Входные данные (stdin)</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Введите входные данные для программы..."
              className="w-full rounded-md border border-border bg-background p-2 text-sm font-mono resize-y min-h-[60px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || !code.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4 text-green-500" />
              {runMutation.isPending ? "Выполнение..." : "Запустить"}
            </Button>
            {task && (
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || !code.trim()}
                className="flex items-center gap-2 bg-primary"
              >
                <Send className="h-4 w-4" />
                {submitMutation.isPending ? "Отправка..." : "Отправить решение"}
              </Button>
            )}
          </div>

          {/* Run output */}
          {runOutput && (
            <div className="rounded-lg bg-slate-900 text-slate-100 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3" />
                  Вывод
                </span>
                <div className="flex items-center gap-2">
                  {runOutput.time !== undefined && <span>{runOutput.time}мс</span>}
                  <span className={cn(
                    "font-medium",
                    runOutput.exitCode === 0 ? "text-green-400" : "text-red-400"
                  )}>
                    exit {runOutput.exitCode}
                  </span>
                </div>
              </div>
              {runOutput.stdout && (
                <pre className="text-sm font-mono whitespace-pre-wrap text-slate-100 max-h-40 overflow-y-auto">
                  {runOutput.stdout}
                </pre>
              )}
              {runOutput.stderr && (
                <pre className="text-sm font-mono whitespace-pre-wrap text-red-400 max-h-32 overflow-y-auto">
                  {runOutput.stderr}
                </pre>
              )}
              {!runOutput.stdout && !runOutput.stderr && (
                <p className="text-xs text-slate-400 italic">Нет вывода</p>
              )}
            </div>
          )}

          {/* Submit result */}
          {submitResult && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {submitResult.passed === submitResult.total ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold text-foreground">
                    {submitResult.passed}/{submitResult.total} тестов пройдено
                  </span>
                </div>
                <Badge
                  className={
                    submitResult.passed === submitResult.total
                      ? "bg-green-500/20 text-green-600 border-0"
                      : "bg-red-500/20 text-red-600 border-0"
                  }
                >
                  {submitResult.passed === submitResult.total ? "Принято" : "Ошибка"}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {submitResult.results.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded text-xs",
                      r.passed ? "bg-green-500/5 text-green-700 dark:text-green-400" : "bg-red-500/5 text-red-700 dark:text-red-400"
                    )}
                  >
                    {r.passed ? (
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span>Тест {i + 1}:</span>
                    {!r.passed && (
                      <span className="text-muted-foreground">
                        ожидалось <code className="bg-muted px-1 rounded">{r.expected}</code>,
                        получено <code className="bg-muted px-1 rounded">{r.actual}</code>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions history */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">История отправок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submissions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm p-2 rounded border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{s.language}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(s.submittedAt).toLocaleString("ru")}
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs",
                      s.status === "ACCEPTED"
                        ? "bg-green-500/20 text-green-600 border-0"
                        : "bg-red-500/20 text-red-600 border-0"
                    )}
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
