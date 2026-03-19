import { cn } from "@/lib/utils"

interface Props {
  className?: string
}

export function UniversityLogo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      aria-label="Логотип КЭПО"
      role="img"
    >
      {/* Shield background */}
      <path
        d="M24 3L6 10V26C6 35 14 42 24 45C34 42 42 35 42 26V10L24 3Z"
        fill="currentColor"
        className="text-primary-foreground/20"
      />
      {/* Book */}
      <rect x="14" y="18" width="9" height="12" rx="1" fill="currentColor" className="text-primary-foreground" />
      <rect x="25" y="18" width="9" height="12" rx="1" fill="currentColor" className="text-primary-foreground/80" />
      <rect x="23" y="17" width="2" height="14" rx="1" fill="currentColor" className="text-primary-foreground/60" />
      {/* Star */}
      <polygon
        points="24,7 25.5,11 30,11 26.5,13.5 28,18 24,15 20,18 21.5,13.5 18,11 22.5,11"
        fill="currentColor"
        className="text-yellow-300"
      />
    </svg>
  )
}
