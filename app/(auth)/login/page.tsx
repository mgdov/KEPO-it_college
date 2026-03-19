"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

const schema = z.object({
  login: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    try {
      await auth.login(data.login, data.password)
      const me = await auth.me()
      qc.setQueryData(["me"], me)
      if (me.role === "ADMIN") router.push("/admin")
      else if (me.role === "TEACHER") router.push("/teacher")
      else router.push("/student")
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string }
      if (apiErr.status === 403) {
        router.push("/pending")
      } else {
        setServerError(apiErr.message ?? "Неверный логин или пароль")
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border border-border">
      <CardHeader className="space-y-1 pb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <LogIn className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">Вход в систему</CardTitle>
        <CardDescription className="text-muted-foreground">
          Введите логин и пароль, полученные от администратора
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              autoComplete="username"
              placeholder="student_ivanov"
              {...register("login")}
              className={errors.login ? "border-destructive" : ""}
            />
            {errors.login && (
              <p className="text-xs text-destructive">{errors.login.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Входим...
              </span>
            ) : (
              "Войти"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Ещё нет аккаунта?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Подать заявку на обучение
            </Link>
          </p>
        </div>

        <div className="mt-3 rounded-lg bg-secondary px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-secondary-foreground">Как получить доступ?</p>
          <p>1. Подайте заявку и загрузите документы</p>
          <p>2. Дождитесь одобрения администратора</p>
          <p>3. Получите логин и пароль по email или телефону</p>
        </div>
      </CardContent>
    </Card>
  )
}
