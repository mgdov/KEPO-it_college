"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  Upload, CheckCircle, AlertCircle, User, Mail, FileText, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/api"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().email("Неверный email"),
  fullName: z.string().min(3, "Введите полное ФИО"),
  suggestedLogin: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface FileItem {
  file: File
  label: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [passport, setPassport] = useState<File | null>(null)
  const [snils, setSnils] = useState<File | null>(null)
  const [otherDocs, setOtherDocs] = useState<FileItem[]>([])

  const passportRef = useRef<HTMLInputElement>(null)
  const snilsRef = useRef<HTMLInputElement>(null)
  const otherRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!passport) { setServerError("Загрузите скан паспорта"); return }
    if (!snils) { setServerError("Загрузите скан СНИЛС"); return }

    setServerError(null)
    const form = new FormData()
    form.append("email", data.email)
    form.append("fullName", data.fullName)
    if (data.suggestedLogin) form.append("suggestedLogin", data.suggestedLogin)
    form.append("passport", passport)
    form.append("snils", snils)
    otherDocs.forEach((d) => form.append("otherDocs[]", d.file))

    try {
      await auth.register(form)
      setSuccess(true)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string }
      if (apiErr.status === 409) {
        setServerError("Пользователь с таким email уже существует")
      } else {
        setServerError(apiErr.message ?? "Ошибка при подаче заявки")
      }
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Заявка отправлена!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ваша заявка передана на рассмотрение администратору.
            После проверки документов вы получите логин и пароль
            по email или телефону.
          </p>
          <Button asChild className="mt-2">
            <Link href="/login">Вернуться к входу</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg shadow-xl border border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold">Подача заявки на обучение</CardTitle>
        <CardDescription>
          Заполните форму и прикрепите документы. После проверки вам выдадут доступ.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Full name */}
          <div className="space-y-1">
            <Label htmlFor="fullName">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                ФИО полностью <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="fullName"
              placeholder="Иванов Иван Иванович"
              {...register("fullName")}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ivanov@example.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Suggested login */}
          <div className="space-y-1">
            <Label htmlFor="suggestedLogin">
              Желаемый логин <span className="text-muted-foreground text-xs">(необязательно)</span>
            </Label>
            <Input
              id="suggestedLogin"
              placeholder="ivanov_ii"
              {...register("suggestedLogin")}
            />
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Документы
            </p>

            {/* Passport */}
            <FileDropZone
              label="Паспорт (скан) *"
              file={passport}
              inputRef={passportRef}
              onSelect={(f) => setPassport(f)}
              onClear={() => setPassport(null)}
              accept=".pdf,.jpg,.jpeg,.png"
            />

            {/* SNILS */}
            <FileDropZone
              label="СНИЛС (скан) *"
              file={snils}
              inputRef={snilsRef}
              onSelect={(f) => setSnils(f)}
              onClear={() => setSnils(null)}
              accept=".pdf,.jpg,.jpeg,.png"
            />

            {/* Other docs */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Прочие документы (необязательно)</p>
              <input
                ref={otherRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  setOtherDocs((prev) => [
                    ...prev,
                    ...files.map((f) => ({ file: f, label: f.name })),
                  ])
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => otherRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                Добавить файл
              </Button>
              {otherDocs.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {otherDocs.map((d, i) => (
                    <li key={i} className="flex items-center justify-between text-xs bg-secondary rounded px-2 py-1">
                      <span className="truncate max-w-[260px]">{d.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setOtherDocs((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-muted-foreground hover:text-destructive ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Отправляем...
              </span>
            ) : (
              "Отправить заявку"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Войти
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function FileDropZone({
  label,
  file,
  inputRef,
  onSelect,
  onClear,
  accept,
}: {
  label: string
  file: File | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: (f: File) => void
  onClear: () => void
  accept: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onSelect(f)
          e.target.value = ""
        }}
      />
      {file ? (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-green-700 dark:text-green-400 truncate">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{file.name}</span>
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full border-2 border-dashed rounded-md px-4 py-3",
            "flex flex-col items-center gap-1 text-muted-foreground",
            "hover:border-primary hover:text-primary transition-colors cursor-pointer"
          )}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">Нажмите для загрузки</span>
        </button>
      )}
    </div>
  )
}
