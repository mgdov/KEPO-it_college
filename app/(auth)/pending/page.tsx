import Link from "next/link"
import { Clock, PhoneCall, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PendingPage() {
  return (
    <Card className="w-full max-w-md shadow-xl text-center">
      <CardContent className="pt-10 pb-8 space-y-5">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Заявка на рассмотрении</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ваши документы переданы администратору. Как только ваша заявка
            будет одобрена, вы получите логин и пароль для входа.
          </p>
        </div>

        <div className="rounded-lg bg-secondary text-left px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-secondary-foreground">Способы получения доступа:</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Уведомление на указанный email</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PhoneCall className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Звонок от администратора</span>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Попробовать войти</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
