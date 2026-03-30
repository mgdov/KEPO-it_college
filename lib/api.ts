const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
const BASE_URL = RAW_BASE_URL.replace(/\/$/, "")
const MOCK_MODE =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" || BASE_URL === ""

/** Absolute URL to the backend API (for download links etc.) */
export function apiUrl(path: string): string {
  const normalizedPath =
    BASE_URL.endsWith("/api") && path.startsWith("/api/")
      ? path.replace(/^\/api/, "")
      : path
  return `${BASE_URL}${normalizedPath}`
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// ─── Mock session (browser-only) ─────────────────────────────────────────────

function getMockSession(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("mock_login")
}
function setMockSession(login: string | null) {
  if (typeof window === "undefined") return
  if (login) sessionStorage.setItem("mock_login", login)
  else sessionStorage.removeItem("mock_login")
}

// ─── Real HTTP request ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath =
    BASE_URL.endsWith("/api") && path.startsWith("/api/")
      ? path.replace(/^\/api/, "")
      : path

  const res = await fetch(`${BASE_URL}${normalizedPath}`, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const json = await res.json()
      if (json.errors && typeof json.errors === "object") {
        const details = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ")
        message = json.message ? `${json.message} (${details})` : details
      } else {
        message = json.message ?? json.error ?? message
      }
    } catch { }
    throw new ApiError(res.status, message)
  }

  const contentType = res.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    const json = await res.json()
    return unwrapEnvelope(json) as T
  }
  return res.blob() as unknown as Promise<T>
}

/**
 * Backend wraps every JSON response in an envelope:
 *   { success: true, <dataKey>: <payload> }
 * This helper strips the envelope and returns the inner payload.
 * — If there is exactly one data key besides "success" and "message",
 *   return its value.
 * — If there are several data keys (e.g. {success, group, subjects}),
 *   return the object without "success".
 * — If the envelope has only {success, message} (mutation ack),
 *   return {message}.
 * — audit-logs returns {data, meta} without "success" — passed through.
 */
function unwrapEnvelope(json: Record<string, unknown>): unknown {
  if (typeof json !== "object" || json === null || !("success" in json)) {
    return json                       // not an envelope — pass through
  }
  const dataKeys = Object.keys(json).filter(
    (k) => k !== "success" && k !== "message"
  )
  if (dataKeys.length === 1) return json[dataKeys[0]]
  if (dataKeys.length > 1) {
    const out: Record<string, unknown> = {}
    for (const k of dataKeys) out[k] = json[k]
    return out
  }
  // only {success, message?} left → return {message} for mutation acks
  return { message: json.message ?? "OK" }
}

// ─── Mock delay helper ────────────────────────────────────────────────────────

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  register: (form: FormData) => {
    if (MOCK_MODE) return mockDelay({ message: "Заявка отправлена" })
    return request<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: form,
    })
  },

  login: async (login: string, password: string) => {
    if (MOCK_MODE) {
      const { MOCK_USERS } = await import("@/lib/mock-data")
      const user = MOCK_USERS[login]
      if (!user || user.password !== password) {
        throw new ApiError(401, "Неверный логин или пароль")
      }
      setMockSession(login)
      return mockDelay({ message: "OK" })
    }
    return request<{ message: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    })
  },

  logout: async () => {
    if (MOCK_MODE) {
      setMockSession(null)
      return mockDelay({ message: "OK" })
    }
    return request<{ message: string }>("/api/auth/logout", { method: "POST" })
  },

  me: async () => {
    if (MOCK_MODE) {
      const { MOCK_USERS } = await import("@/lib/mock-data")
      const login = getMockSession()
      if (!login || !MOCK_USERS[login]) throw new ApiError(401, "Не авторизован")
      return mockDelay(MOCK_USERS[login].me)
    }
    return request<MeResponse>("/api/auth/me")
  },
}

// ─── Student ─────────────────────────────────────────────────────────────────

export const student = {
  profile: async () => {
    const raw = await request<unknown>("/api/student/profile")

    // Legacy/new backend compatibility:
    // - old frontend shape: { id, fullName, email, login, student: { group } }
    // - current backend shape: { id, fullName, email, group, averageGrade, ... }
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>
      if (obj.student && typeof obj.student === "object") {
        return obj as StudentProfile
      }

      const group = obj.group as
        | { id: string | number; name: string; course: number; specialty: string }
        | undefined

      return {
        id: String(obj.id ?? ""),
        fullName: String(obj.fullName ?? ""),
        email: String(obj.email ?? ""),
        login: String(obj.login ?? ""),
        student: {
          id: String(obj.id ?? ""),
          group: {
            id: String(group?.id ?? ""),
            name: String(group?.name ?? ""),
            course: Number(group?.course ?? 0),
            specialty: String(group?.specialty ?? ""),
          },
        },
      } as StudentProfile
    }

    return raw as StudentProfile
  },

  grades: async () => {
    const raw = await request<unknown>("/api/student/grades")

    // Expected frontend shape: Grade[]
    // Backend may return either Grade[] directly or { grades: [...], summary: {...} }
    if (Array.isArray(raw)) {
      return raw as Grade[]
    }

    if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).grades)) {
      const source = (raw as { grades: Array<Record<string, unknown>> }).grades
      return source.map((g) => {
        // New backend grade shape: { id, subject: {name}, value, gradeType, createdAt }
        const subject = (g.subject as Record<string, unknown> | undefined) ?? {}
        const value = Number(g.value ?? 0)
        return {
          lessonId: String(g.id ?? ""),
          lessonTitle: String(g.gradeType ?? "Оценка"),
          subjectName: String(subject.name ?? "Предмет"),
          score: value,
          maxScore: 5,
          gradedAt: String(g.createdAt ?? new Date().toISOString()),
        } satisfies Grade
      })
    }

    return []
  },

  schedule: (from: string, to: string) =>
    request<ScheduleLesson[]>(`/api/student/schedule?from=${from}&to=${to}`),

  lesson: (lessonId: string) =>
    request<LessonDetail>(`/api/student/lessons/${lessonId}`),

  viewMaterialUrl: (lessonId: string, materialId: string) =>
    apiUrl(`/api/student/lessons/${lessonId}/materials/${materialId}/view`),

  downloadMaterial: (lessonId: string, materialId: string) =>
    request<Blob>(
      `/api/student/lessons/${lessonId}/materials/${materialId}/download`
    ),

  startAttempt: (lessonId: string) =>
    request<Attempt>(`/api/student/lessons/${lessonId}/attempts`, {
      method: "POST",
    }),

  getAttempt: (attemptId: string) =>
    request<AttemptDetail>(`/api/student/attempts/${attemptId}`),

  submitAttempt: (
    attemptId: string,
    answers: { questionId: string; selectedOptionId: string }[]
  ) =>
    request<AttemptResult>(`/api/student/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  // ─── Pool variants ─────────────────────────────────────────
  getPoolVariant: (lessonId: string) =>
    request<{
      success: boolean
      assignment: {
        id: number
        poolId: number
        variantIndex: number
        content: unknown
        topic: string
        contentType: string
        assignedAt: string
      }
    }>(`/api/student/lessons/${lessonId}/pool-variant`),

  assignPoolVariant: (lessonId: string) =>
    request<{
      success: boolean
      assignment: {
        id: number
        variantIndex: number
        content: unknown
        assignedAt: string
      }
    }>(`/api/student/lessons/${lessonId}/pool-variant`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
}

// ─── Programming ─────────────────────────────────────────────────────────────

export const programming = {
  run: (lessonId: string, sourceCode: string, language: string, stdin?: string) =>
    request<RunResult>("/api/programming/run", {
      method: "POST",
      body: JSON.stringify({ lessonId, sourceCode, language, stdin }),
    }),

  submit: (lessonId: string, sourceCode: string, language: string) =>
    request<SubmitResult>("/api/programming/submit", {
      method: "POST",
      body: JSON.stringify({ lessonId, sourceCode, language }),
    }),

  task: (lessonId: string) =>
    request<ProgrammingTask>(`/api/programming/lessons/${lessonId}/task`),

  submissions: (lessonId: string) =>
    request<Submission[]>(`/api/programming/lessons/${lessonId}/submissions`),

  submission: (submissionId: string) =>
    request<Submission>(`/api/programming/submissions/${submissionId}`),

  health: () => request<{ status: string }>("/api/programming/health"),
}

// ─── Games ───────────────────────────────────────────────────────────────────

export const games = {
  types: () => request<GameType[]>("/api/games/types"),

  info: (lessonId: string) =>
    request<{
      gameType: string
      gameName?: string
      activeSession: GameSession | null
      sessions: GameSession[]
    }>(`/api/student/lessons/${lessonId}/game/info`),

  createSession: (lessonId: string, _gameType?: string) =>
    request<GameSession>(`/api/student/lessons/${lessonId}/game/solo/start`, {
      method: "POST",
    }),

  session: (sessionId: string) =>
    request<GameSession>(`/api/games/sessions/${sessionId}`),

  updateState: (sessionId: string, state: object) =>
    request<GameSession>(`/api/games/sessions/${sessionId}/state`, {
      method: "PUT",
      body: JSON.stringify({ state }),
    }),

  finish: (
    sessionId: string,
    winner: string,
    score?: number,
    stats?: GameFinishStats
  ) =>
    request<GameSession>(`/api/games/sessions/${sessionId}/finish`, {
      method: "POST",
      body: JSON.stringify({ winner, score, stats }),
    }),

  cancel: (sessionId: string) =>
    request<GameSession>(`/api/games/sessions/${sessionId}/cancel`, {
      method: "POST",
    }),

  lessonSessions: (lessonId: string) =>
    request<GameSession[]>(`/api/student/lessons/${lessonId}/game/sessions`),

  // PvP
  createPvp: (lessonId: string, _gameType?: string) =>
    request<GameSession>(`/api/student/lessons/${lessonId}/game/pvp/create`, {
      method: "POST",
    }),

  openPvp: (lessonId: string) =>
    request<GameSession[]>(`/api/student/lessons/${lessonId}/game/pvp/open`),

  joinPvp: (sessionId: string) =>
    request<GameSession>(`/api/games/pvp/${sessionId}/join`, {
      method: "POST",
    }),

  pvpMove: (sessionId: string, move: object) =>
    request<object>(`/api/games/pvp/${sessionId}/move`, {
      method: "POST",
      body: JSON.stringify({ move }),
    }),

  pvpMoves: (sessionId: string, after?: number) =>
    request<object[]>(
      `/api/games/pvp/${sessionId}/moves${after !== undefined ? `?after=${after}` : ""}`
    ),

  pvpPoll: (sessionId: string) =>
    request<object>(`/api/games/pvp/${sessionId}/poll`),

  pvpTurn: (sessionId: string) =>
    request<object>(`/api/games/pvp/${sessionId}/turn`),
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export const admin = {
  // Users
  users: (status?: string) =>
    request<AdminUser[]>(`/api/admin/users${status ? `?status=${status}` : ""}`),

  approve: (userId: string, groupId: string) =>
    request<{ message: string }>("/api/admin/approve", {
      method: "POST",
      body: JSON.stringify({ userId, groupId }),
    }),

  // Groups
  groups: () => request<Group[]>("/api/admin/groups"),

  groupsByTeacher: (teacherId: string, search?: string) => {
    const q = new URLSearchParams(
      Object.entries({ teacherId, search }).filter(([, v]) => v) as [string, string][]
    ).toString()
    return request<Group[]>(`/api/admin/groups${q ? `?${q}` : ""}`)
  },

  group: (id: string) => request<Group>(`/api/admin/groups/${id}`),

  groupStudents: (groupId: string) =>
    request<AdminUser[]>(`/api/admin/groups/${groupId}/students`),

  createGroup: (data: { name: string; course: number; specialty: string }) =>
    request<Group>("/api/admin/groups", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateGroup: (id: string, data: Partial<{ name: string; course: number; specialty: string }>) =>
    request<Group>(`/api/admin/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    request<{ message: string }>(`/api/admin/groups/${id}`, {
      method: "DELETE",
    }),

  // Subjects
  subjects: () => request<Subject[]>("/api/admin/subjects"),

  subject: (id: string) => request<Subject>(`/api/admin/subjects/${id}`),

  createSubject: (data: { name: string; code: string }) =>
    request<Subject>("/api/admin/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubject: (id: string, data: Partial<{ name: string; code: string }>) =>
    request<Subject>(`/api/admin/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteSubject: (id: string) =>
    request<{ message: string }>(`/api/admin/subjects/${id}`, {
      method: "DELETE",
    }),

  // Lessons
  lessons: (params?: { groupId?: string; subjectId?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
    ).toString()
    return request<AdminLesson[]>(`/api/admin/lessons${q ? `?${q}` : ""}`)
  },

  lesson: (id: string) => request<AdminLesson>(`/api/admin/lessons/${id}`),

  createLesson: (data: {
    groupId: string | number
    subjectId: string | number
    lessonType: string
    gameType?: string
    startsAt: string
    endsAt: string
  }) =>
    request<AdminLesson>("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        groupId: Number(data.groupId),
        subjectId: Number(data.subjectId),
      }),
    }),

  updateLesson: (id: string, data: object) =>
    request<AdminLesson>(`/api/admin/lessons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteLesson: (id: string) =>
    request<{ message: string }>(`/api/admin/lessons/${id}`, {
      method: "DELETE",
    }),

  unlockLesson: (id: string, data: { studentId: string; reason: string; expiresAt?: string }) =>
    request<{ message: string }>(`/api/admin/lessons/${id}/unlock`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Materials
  materials: (lessonId: string) =>
    request<Material[]>(`/api/admin/lessons/${lessonId}/materials`),

  uploadMaterial: (lessonId: string, form: FormData) =>
    request<Material>(`/api/admin/lessons/${lessonId}/materials`, {
      method: "POST",
      body: form,
    }),

  deleteMaterial: (materialId: string) =>
    request<{ message: string }>(`/api/admin/materials/${materialId}`, {
      method: "DELETE",
    }),

  // Assessments
  assessments: (params?: { lessonId?: string; isPublished?: boolean }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return request<Assessment[]>(`/api/admin/assessments${q ? `?${q}` : ""}`)
  },

  assessment: (id: string) =>
    request<AssessmentDetail>(`/api/admin/assessments/${id}`),

  updateAssessment: (id: string, data: object) =>
    request<Assessment>(`/api/admin/assessments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  createAssessment: (lessonId: string, data: object) =>
    request<Assessment>(`/api/admin/lessons/${lessonId}/assessment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addQuestion: (assessmentId: string, data: object) =>
    request<Question>(`/api/admin/assessments/${assessmentId}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  importQuestions: (assessmentId: string, text: string) =>
    request<{ message: string }>(`/api/admin/assessments/${assessmentId}/import`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  publishAssessment: (assessmentId: string) =>
    request<{ message: string }>(`/api/admin/assessments/${assessmentId}/publish`, {
      method: "POST",
    }),

  deleteQuestion: (questionId: string) =>
    request<{ message: string }>(`/api/admin/questions/${questionId}`, {
      method: "DELETE",
    }),

  // Programming tasks
  programmingTasks: (lessonId?: string) =>
    request<ProgrammingTask[]>(
      `/api/admin/programming-tasks${lessonId ? `?lessonId=${lessonId}` : ""}`
    ),

  programmingTask: (taskId: string) =>
    request<ProgrammingTask>(`/api/admin/programming-tasks/${taskId}`),

  createProgrammingTask: (data: object) =>
    request<ProgrammingTask>("/api/admin/programming-tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProgrammingTask: (taskId: string, data: object) =>
    request<ProgrammingTask>(`/api/admin/programming-tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProgrammingTask: (taskId: string) =>
    request<{ message: string }>(`/api/admin/programming-tasks/${taskId}`, {
      method: "DELETE",
    }),

  // Results
  resultsByLesson: (lessonId: string) =>
    request<object>(`/api/admin/results/lessons/${lessonId}`),

  resultsBySubject: (subjectId: string) =>
    request<object>(`/api/admin/results/subjects/${subjectId}`),

  resultsByGroup: (groupId: string) =>
    request<object>(`/api/admin/results/groups/${groupId}`),

  // Audit logs
  auditLogs: (params?: object) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return request<AuditLogsResponse>(`/api/admin/audit-logs${q ? `?${q}` : ""}`)
  },
}

// ─── Admin AI ────────────────────────────────────────────────────────────────

export const adminAi = {
  generateMathQuestions: (data: {
    topic: string
    count: number
    difficulty: "easy" | "medium" | "hard"
    language?: "ru"
  }) =>
    request<AiQuestionsDraft>("/api/admin/ai/generate/math-questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateQuizQuestions: (data: {
    topic: string
    count: number
    difficulty: "easy" | "medium" | "hard"
    language?: "ru"
  }) =>
    request<AiQuestionsDraft>("/api/admin/ai/generate/quiz-questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateProgrammingTask: (data: {
    topic: string
    difficulty: "easy" | "medium" | "hard"
    allowedLanguages?: string[]
    language?: "ru"
  }) =>
    request<AiProgrammingTaskDraft>("/api/admin/ai/generate/programming-task", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  applyQuestions: (data: {
    assessmentId: number
    draft: AiQuestionsDraft
  }) =>
    request<{ assessmentId: number; importedCount: number }>("/api/admin/ai/apply/questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  applyProgrammingTask: (data: {
    lessonId: number
    draft: AiProgrammingTaskDraft
  }) =>
    request<{ lessonId: number; taskId: number }>("/api/admin/ai/apply/programming-task", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

export interface AiQuestionsDraft {
  topic: string
  questions: {
    text: string
    options: { text: string; isCorrect: boolean }[]
  }[]
}

export interface AiProgrammingTaskDraft {
  title: string
  statement: string
  allowedLanguages: string[]
  timeLimitMs: number
  memoryLimitKb: number
  testCases: { input: string; expected: string }[]
}

// ─── Admin Pools ─────────────────────────────────────────────────────────────

export interface TaskPool {
  id: number
  subjectId: number
  topic: string
  contentType: "QUIZ" | "MATH" | "PROGRAMMING"
  difficulty: string
  status: "PENDING" | "GENERATING" | "READY" | "FAILED"
  targetCount: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  subject: { id: number; name: string }
  _count: { variants: number; assignments?: number }
}

export interface TaskPoolVariant {
  id: number
  poolId: number
  variantIndex: number
  contentJson: unknown
  createdAt: string
}

export interface TaskPoolDetail extends TaskPool {
  variants: TaskPoolVariant[]
}

export interface LessonPoolLink {
  id: number
  lessonId: number
  poolId: number
  linkedByUserId: number | null
  createdAt: string
  lesson?: {
    id: number
    date: string
    lessonType: string
    group: { id: number; name: string }
    subject?: { id: number; name: string }
  }
  pool?: TaskPool
}

export const adminPools = {
  create: (data: {
    subjectId: number
    topic: string
    contentType: "QUIZ" | "MATH" | "PROGRAMMING"
    difficulty?: string
    targetCount?: number
  }) =>
    request<TaskPool>("/api/admin/pools", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (params?: {
    subjectId?: number
    contentType?: string
    status?: string
    page?: number
    pageSize?: number
  }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return request<{ data: TaskPool[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/admin/pools${q ? `?${q}` : ""}`
    )
  },

  get: (id: number) =>
    request<TaskPoolDetail>(`/api/admin/pools/${id}`),

  generate: (id: number) =>
    request<{ poolId: number; status: string }>(`/api/admin/pools/${id}/generate`, {
      method: "POST",
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/admin/pools/${id}`, {
      method: "DELETE",
    }),

  getLessonLinks: (id: number) =>
    request<LessonPoolLink[]>(`/api/admin/pools/${id}/lessons`),

  linkLesson: (poolId: number, lessonId: number) =>
    request<LessonPoolLink>(`/api/admin/pools/${poolId}/link-lesson`, {
      method: "POST",
      body: JSON.stringify({ lessonId }),
    }),

  unlinkLesson: (poolId: number, lessonId: number) =>
    request<{ message: string }>(`/api/admin/pools/${poolId}/unlink-lesson/${lessonId}`, {
      method: "DELETE",
    }),
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "PENDING" | "STUDENT" | "TEACHER" | "ADMIN"

export interface MeResponse {
  id: string
  email: string
  role: UserRole
  login: string
  fullName: string
  student?: { id: string; groupId: string }
}

export interface StudentProfile {
  id: string
  fullName: string
  email: string
  login: string
  student: {
    id: string
    group: {
      id: string
      name: string
      course: number
      specialty: string
    }
  }
}

export interface Grade {
  lessonId: string
  lessonTitle: string
  subjectName: string
  score: number
  maxScore: number
  gradedAt: string
}

export interface ScheduleLesson {
  id: string
  lessonType: "LECTURE" | "LAB_QUIZ" | "LAB_MATH" | "LAB_PROGRAMMING" | "LAB_GAME" | "EXAM" | "CREDIT"
  gameType?: string
  startsAt: string
  endsAt: string
  subject: { id: string; name: string; code: string }
  isLocked: boolean
  isUnlocked?: boolean
}

export interface LessonDetail extends ScheduleLesson {
  materials: Material[]
  assessment?: Assessment
  programmingTask?: ProgrammingTask
}

export interface Material {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileName: string
  fileType: string
  createdAt: string
}

export interface Attempt {
  id: string
  lessonId: string
  startedAt: string
  finishedAt?: string
  score?: number
}

export interface AttemptDetail extends Attempt {
  questions: AttemptQuestion[]
}

export interface AttemptQuestion {
  id: string
  text: string
  options: { id: string; text: string }[]
}

export interface AttemptResult {
  score: number
  maxScore: number
  passed: boolean
  answers: { questionId: string; correct: boolean }[]
}

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number
  time?: number
  memory?: number
}

export interface SubmitResult {
  passed: number
  total: number
  results: { input: string; expected: string; actual: string; passed: boolean }[]
}

export interface ProgrammingTask {
  id: string
  lessonId: string
  title: string
  statement: string
  allowedLanguages: string[]
  testCases: { input: string; expected: string }[]
  timeLimitMs: number
  memoryLimitKb: number
  maxAttempts: number
}

export interface Submission {
  id: string
  lessonId: string
  language: string
  sourceCode: string
  status: string
  score?: number
  submittedAt: string
}

export interface GameType {
  type: string
  label: string
}

export type DifficultyLevel = "easy" | "medium" | "hard"

export interface GameFinishStats {
  points: number
  difficulty: DifficultyLevel | string
  durationSeconds?: number
  mode?: "vsComputer" | "pvp"
}

export interface GameSession {
  id: string
  lessonId: string
  gameType: string
  mode: "vsComputer" | "pvp"
  status: "active" | "finished" | "cancelled"
  state?: object
  winner?: string
  score?: number
  player1Id?: string
  player2Id?: string
  createdAt: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  login?: string
  role: UserRole
  createdAt: string
  student?: { id: string; group?: { id: string; name: string } }
}

export interface Group {
  id: string
  name: string
  course: number
  specialty: string
}

export interface Subject {
  id: string
  name: string
  code: string
}

export interface AdminLesson {
  id: string
  lessonType: string
  gameType?: string
  startsAt: string
  endsAt: string
  subject: Subject
  group: Group
}

export interface Assessment {
  id: string
  title: string
  assessmentType: string
  passingScore?: number
  maxAttempts?: number
  durationMinutes?: number
  isPublished: boolean
  lessonId: string
}

export interface AssessmentDetail extends Assessment {
  questions: Question[]
}

export interface Question {
  id: string
  text: string
  options: { id: string; text: string; isCorrect: boolean }[]
}

export interface AuditLogsResponse {
  data: AuditLog[]
  total: number
  page: number
  pageSize: number
}

export interface AuditLog {
  id: string
  actorUserId: string
  actorName: string
  action: string
  entityType: string
  entityId: string
  createdAt: string
}
