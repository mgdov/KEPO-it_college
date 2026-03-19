"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { student } from "@/lib/api"
import {
  CreditCard, CheckCircle, Lock, Building2, Info, ArrowLeft,
  Printer, Download, AlertCircle, Clock, CalendarDays, Banknote,
  ShieldCheck, Wifi
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Static payment data (stub — API has no payment endpoints) ─────────────

const YEAR = "2024/2025"
const TUITION_PER_SEMESTER = 42000

const SEMESTERS: Semester[] = [
  {
    id: "2023-2",
    label: "2 семестр 2023/2024",
    amount: 39500,
    status: "paid",
    paidAt: "2024-02-05",
    receiptNo: "КЭП-2024-0112",
  },
  {
    id: "2024-1",
    label: "1 семестр 2024/2025",
    amount: TUITION_PER_SEMESTER,
    status: "paid",
    paidAt: "2024-09-03",
    receiptNo: "КЭП-2024-0581",
  },
  {
    id: "2024-2",
    label: "2 семестр 2024/2025",
    amount: TUITION_PER_SEMESTER,
    status: "due",
    dueAt: "2025-03-01",
  },
  {
    id: "2025-1",
    label: "1 семестр 2025/2026",
    amount: 45000,
    status: "upcoming",
    dueAt: "2025-09-01",
  },
]

const BANK_DETAILS = {
  recipient: "АНО ДПО «КЭПО»",
  inn: "6165001855",
  kpp: "616501001",
  bank: "Отделение Ростов-на-Дону Банка России",
  bik: "046015001",
  account: "40601810200001000001",
  corr: "30101810100000000001",
  kbk: "00000000000000000130",
  oktmo: "60701000",
}

type SemesterStatus = "paid" | "due" | "upcoming"

interface Semester {
  id: string
  label: string
  amount: number
  status: SemesterStatus
  paidAt?: string
  dueAt?: string
  receiptNo?: string
}

interface CardData {
  number: string
  name: string
  expiry: string
  cvv: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(val: string) {
  return new Intl.NumberFormat("ru-RU").format(val as unknown as number)
}

function fmtDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function detectCardType(num: string): "visa" | "mc" | "mir" | null {
  const n = num.replace(/\s/g, "")
  if (n.startsWith("4")) return "visa"
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mc"
  if (/^220[0-4]/.test(n)) return "mir"
  return null
}

function CardBrandLabel({ type }: { type: "visa" | "mc" | "mir" | null }) {
  if (!type) return null
  const labels: Record<string, string> = { visa: "VISA", mc: "Mastercard", mir: "МИР" }
  const colors: Record<string, string> = {
    visa: "text-blue-600 dark:text-blue-400",
    mc: "text-orange-500 dark:text-orange-400",
    mir: "text-green-600 dark:text-green-400",
  }
  return (
    <span className={cn("text-xs font-bold tracking-widest", colors[type])}>
      {labels[type]}
    </span>
  )
}

// ─── Card Preview ─────────────────────────────────────────────────────────

function CardPreview({ card }: { card: CardData }) {
  const type = detectCardType(card.number)
  const displayNum = (card.number || "•••• •••• •••• ••••")
    .padEnd(19, "•").slice(0, 19)

  return (
    <div className="relative h-44 w-full max-w-xs mx-auto rounded-2xl overflow-hidden select-none">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-[oklch(0.32_0.14_240)] to-[oklch(0.22_0.09_260)]" />
      {/* Decoration circles */}
      <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5" />

      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <Wifi className="h-5 w-5 text-white/60 rotate-90" />
          {type ? (
            <CardBrandLabel type={type} />
          ) : (
            <CreditCard className="h-5 w-5 text-white/40" />
          )}
        </div>

        {/* Chip + number */}
        <div className="space-y-3">
          <div className="h-7 w-11 rounded-md bg-amber-300/80 flex items-center justify-center">
            <div className="h-4 w-7 rounded-sm border border-amber-500/50 bg-amber-200/60" />
          </div>
          <p className="font-mono text-white tracking-[0.2em] text-base">
            {displayNum}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Владелец</p>
            <p className="text-white text-sm font-medium tracking-wide truncate max-w-[140px]">
              {card.name || "ИМЯ ФАМИЛИЯ"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Действует до</p>
            <p className="text-white text-sm font-medium font-mono">{card.expiry || "ММ/ГГ"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Receipt ──────────────────────────────────────────────────────────────

function printReceipt(sem: Semester, profile: { fullName: string; student?: { group?: { name?: string } } } | undefined) {
  const w = window.open("", "_blank", "width=620,height=820")
  if (!w) return
  w.document.write(`
    <html><head><title>Квитанция об оплате</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #111; font-size: 13px; }
      h2 { text-align: center; color: #0033A0; margin-bottom: 4px; }
      .sub { text-align: center; color: #555; margin-bottom: 24px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
      td:first-child { color: #666; width: 45%; }
      td:last-child { font-weight: 600; }
      .total td { background: #f0f4ff; font-size: 15px; }
      .footer { margin-top: 32px; text-align: center; color: #888; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
      .stamp { display: inline-block; border: 2px solid #0033A0; color: #0033A0; padding: 6px 18px;
               border-radius: 4px; font-weight: bold; letter-spacing: 1px; margin-top: 20px; font-size: 14px; }
    </style></head><body>
    <h2>АНО ДПО «КЭПО»</h2>
    <div class="sub">Квитанция об оплате образовательных услуг · № ${sem.receiptNo ?? "—"}</div>
    <table>
      <tr><td>Студент</td><td>${profile?.fullName ?? "—"}</td></tr>
      <tr><td>Группа</td><td>${profile?.student?.group?.name ?? "—"}</td></tr>
      <tr><td>Учебный период</td><td>${sem.label}</td></tr>
      <tr><td>Дата оплаты</td><td>${fmtDate(sem.paidAt)}</td></tr>
    </table>
    <table>
      <tr><td>Получатель</td><td>${BANK_DETAILS.recipient}</td></tr>
      <tr><td>ИНН</td><td>${BANK_DETAILS.inn}</td></tr>
      <tr><td>КПП</td><td>${BANK_DETAILS.kpp}</td></tr>
      <tr><td>Банк</td><td>${BANK_DETAILS.bank}</td></tr>
      <tr><td>БИК</td><td>${BANK_DETAILS.bik}</td></tr>
      <tr><td>Расчётный счёт</td><td>${BANK_DETAILS.account}</td></tr>
    </table>
    <table>
      <tr class="total">
        <td>Сумма оплаты</td>
        <td>${new Intl.NumberFormat("ru-RU").format(sem.amount)} руб. 00 коп.</td>
      </tr>
    </table>
    <div style="text-align:center"><div class="stamp">ОПЛАЧЕНО</div></div>
    <div class="footer">Сформировано автоматически системой КЭПО · ${new Date().toLocaleDateString("ru-RU")}</div>
    </body></html>
  `)
  w.document.close()
  w.print()
}

// ─── Main component ───────────────────────────────────────────────────────

export default function PaymentPage() {
  const { data: profile } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: student.profile,
  })

  const [step, setStep] = useState<"list" | "pay" | "success">("list")
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)
  const [payMethod, setPayMethod] = useState<"card" | "bank">("card")
  const [card, setCard] = useState<CardData>({ number: "", name: "", expiry: "", cvv: "" })
  const [loading, setLoading] = useState(false)

  const paidSemesters = SEMESTERS.filter((s) => s.status === "paid")
  const dueSemester = SEMESTERS.find((s) => s.status === "due")
  const totalPaid = paidSemesters.reduce((s, x) => s + x.amount, 0)
  const totalAll = SEMESTERS.filter((s) => s.status !== "upcoming").reduce((s, x) => s + x.amount, 0)
  const paymentProgress = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0

  function formatCardNum(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  }
  function formatExpiry(val: string) {
    return val.replace(/\D/g, "").slice(0, 4).replace(/^(.{2})(.+)/, "$1/$2")
  }

  const cardType = detectCardType(card.number)
  const isCardValid =
    card.number.replace(/\s/g, "").length === 16 &&
    card.name.trim().length >= 3 &&
    card.expiry.length === 5 &&
    card.cvv.length === 3

  async function handlePay() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    setLoading(false)
    setStep("success")
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (step === "success" && selectedSemester) {
    const receiptNo = `КЭП-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`
    return (
      <div className="max-w-md mx-auto pt-10 space-y-6">
        {/* Icon */}
        <div className="text-center space-y-3">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-11 w-11 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Оплата выполнена</h2>
          <p className="text-muted-foreground text-sm">
            Платёж за <span className="font-semibold text-foreground">{selectedSemester.label}</span> успешно проведён
          </p>
        </div>

        {/* Receipt card */}
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Сумма</span>
              <span className="font-bold text-foreground text-base">{fmt(String(selectedSemester.amount))} ₽</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Студент</span>
              <span className="font-medium text-foreground">{profile?.fullName ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Период</span>
              <span className="font-medium text-foreground">{selectedSemester.label}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">№ квитанции</span>
              <span className="font-mono font-medium text-foreground">{receiptNo}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Дата и время</span>
              <span className="font-medium text-foreground">{new Date().toLocaleString("ru-RU")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3 flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
          Квитанция отправлена на ваш email. Зачисление отражается в течение 1 рабочего дня.
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Распечатать
          </Button>
          <Button asChild className="flex-1">
            <Link href="/student">Вернуться</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Payment form ────────────────────────────────────────────────────────
  if (step === "pay" && selectedSemester) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2" onClick={() => setStep("list")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Оплата обучения</h1>
            <p className="text-xs text-muted-foreground">{selectedSemester.label}</p>
          </div>
        </div>

        {/* Order summary */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-foreground">{selectedSemester.label}</p>
                {profile && (
                  <>
                    <p className="text-muted-foreground">{profile.fullName}</p>
                    <p className="text-muted-foreground">{profile.student?.group?.name}</p>
                  </>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-primary">
                  {fmt(String(selectedSemester.amount))} ₽
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">к оплате</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment method tabs */}
        <Tabs value={payMethod} onValueChange={(v) => setPayMethod(v as "card" | "bank")}>
          <TabsList className="w-full h-11">
            <TabsTrigger value="card" className="flex-1 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              Банковская карта
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex-1 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Квитанция / Банк
            </TabsTrigger>
          </TabsList>

          {/* ── Card tab ── */}
          <TabsContent value="card" className="mt-4 space-y-5">
            <CardPreview card={card} />

            <Card>
              <CardContent className="p-5 space-y-4">
                {/* Number */}
                <div className="space-y-1.5">
                  <Label>Номер карты</Label>
                  <div className="relative">
                    <Input
                      className="pr-20 font-mono tracking-wider"
                      placeholder="0000 0000 0000 0000"
                      value={card.number}
                      onChange={(e) =>
                        setCard((p) => ({ ...p, number: formatCardNum(e.target.value) }))
                      }
                      maxLength={19}
                      inputMode="numeric"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cardType ? (
                        <CardBrandLabel type={cardType} />
                      ) : (
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Cardholder */}
                <div className="space-y-1.5">
                  <Label>Имя владельца (как на карте)</Label>
                  <Input
                    placeholder="IVAN PETROV"
                    className="uppercase tracking-wide"
                    value={card.name}
                    onChange={(e) =>
                      setCard((p) => ({ ...p, name: e.target.value.toUpperCase().replace(/[^A-Z\s]/g, "") }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Срок действия</Label>
                    <Input
                      placeholder="ММ/ГГ"
                      value={card.expiry}
                      onChange={(e) =>
                        setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))
                      }
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label>CVV / CVC</Label>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="•••"
                      type="password"
                      value={card.cvv}
                      onChange={(e) =>
                        setCard((p) => ({
                          ...p,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                        }))
                      }
                      maxLength={3}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {/* Security note */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-secondary p-3">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  Платёж защищён SSL-шифрованием. Данные карты не сохраняются.
                </div>

                <Button
                  className="w-full h-11 text-base font-semibold"
                  onClick={handlePay}
                  disabled={loading || !isCardValid}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Обработка платежа...
                    </span>
                  ) : (
                    `Оплатить ${fmt(String(selectedSemester.amount))} ₽`
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Bank transfer tab ── */}
          <TabsContent value="bank" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Реквизиты для оплаты</CardTitle>
                <CardDescription>Оплатите через отделение банка или интернет-банк</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  ["Получатель", BANK_DETAILS.recipient],
                  ["ИНН", BANK_DETAILS.inn],
                  ["КПП", BANK_DETAILS.kpp],
                  ["Банк", BANK_DETAILS.bank],
                  ["БИК", BANK_DETAILS.bik],
                  ["К/счёт", BANK_DETAILS.corr],
                  ["Р/счёт", BANK_DETAILS.account],
                  ["КБК", BANK_DETAILS.kbk],
                  ["ОКТМО", BANK_DETAILS.oktmo],
                  [
                    "Назначение платежа",
                    `Оплата за обучение, ${selectedSemester.label}, ${profile?.fullName ?? "студент"}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 py-1.5 border-b border-border last:border-0 text-sm">
                    <span className="text-muted-foreground flex-shrink-0">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-3 py-1.5 text-sm">
                  <span className="text-muted-foreground flex-shrink-0">Сумма</span>
                  <span className="font-bold text-primary text-base">
                    {fmt(String(selectedSemester.amount))} руб. 00 коп.
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2 text-xs rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 p-3">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              После оплаты предъявите квитанцию в бухгалтерию (каб. 212). Зачисление в течение 3 рабочих дней.
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                printReceipt(
                  { ...selectedSemester, paidAt: new Date().toISOString().slice(0, 10) },
                  profile
                )
              }
            >
              <Printer className="h-4 w-4 mr-2" />
              Распечатать квитанцию для банка
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ── Main list ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Оплата обучения</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Учебный год {YEAR} · ГБПОУ «КЭПО»
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label="Оплачено"
          value={`${fmt(String(totalPaid))} ₽`}
          sub={`${paidSemesters.length} из ${SEMESTERS.filter(s => s.status !== "upcoming").length} семестров`}
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
          label="К оплате"
          value={dueSemester ? `${fmt(String(dueSemester.amount))} ₽` : "Нет задолженности"}
          sub={dueSemester ? `Срок: ${fmtDate(dueSemester.dueAt)}` : "Всё в порядке"}
          highlight={!!dueSemester}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5 text-primary" />}
          label="Прогресс"
          value={`${paymentProgress}%`}
          sub={
            <Progress value={paymentProgress} className="h-1.5 mt-1" />
          }
        />
      </div>

      {/* Due semester alert */}
      {dueSemester && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Требуется оплата: {dueSemester.label}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                  Срок оплаты: {fmtDate(dueSemester.dueAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xl font-bold text-foreground">
                {fmt(String(dueSemester.amount))} ₽
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedSemester(dueSemester)
                  setStep("pay")
                }}
              >
                Оплатить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">История платежей</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {SEMESTERS.map((sem) => (
              <div
                key={sem.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors",
                  sem.status === "due" && "bg-amber-50/50 dark:bg-amber-900/5",
                  sem.status === "upcoming" && "opacity-60"
                )}
              >
                {/* Left */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      sem.status === "paid" && "bg-green-500/10",
                      sem.status === "due" && "bg-amber-500/10",
                      sem.status === "upcoming" && "bg-muted"
                    )}
                  >
                    {sem.status === "paid" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : sem.status === "due" ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{sem.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {sem.status === "paid" && `Оплачено ${fmtDate(sem.paidAt)} · ${sem.receiptNo}`}
                      {sem.status === "due" && `Срок оплаты: ${fmtDate(sem.dueAt)}`}
                      {sem.status === "upcoming" && `Плановый срок: ${fmtDate(sem.dueAt)}`}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 flex-shrink-0 pl-12 sm:pl-0">
                  <span className="font-semibold text-foreground">
                    {fmt(String(sem.amount))} ₽
                  </span>

                  {sem.status === "paid" && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 text-xs">
                        Оплачено
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Распечатать квитанцию"
                        onClick={() => printReceipt(sem, profile)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {sem.status === "due" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSemester(sem)
                        setStep("pay")
                      }}
                    >
                      Оплатить
                    </Button>
                  )}

                  {sem.status === "upcoming" && (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Предстоит
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank details info block */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Реквизиты организации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {[
              ["Получатель", BANK_DETAILS.recipient],
              ["ИНН / КПП", `${BANK_DETAILS.inn} / ${BANK_DETAILS.kpp}`],
              ["Банк", BANK_DETAILS.bank],
              ["БИК", BANK_DETAILS.bik],
              ["Расчётный счёт", BANK_DETAILS.account],
              ["Корр. счёт", BANK_DETAILS.corr],
            ].map(([label, value]) => (
              <div key={label} className="text-sm">
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            По вопросам оплаты обращайтесь в бухгалтерию: каб. 212, тел. +7 (863) 222-xx-xx
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Card className={cn(highlight && "border-amber-300 dark:border-amber-700")}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-bold text-foreground truncate">{value}</p>
          <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
        </div>
      </CardContent>
    </Card>
  )
}
