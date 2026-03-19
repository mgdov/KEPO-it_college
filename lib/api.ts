const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
const MOCK_MODE =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" || BASE_URL === ""

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
  const res = await fetch(`${BASE_URL}${path}`, {
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
      message = json.message ?? json.error ?? message
    } catch { }
    throw new ApiError(res.status, message)
  }

  const contentType = res.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>
  }
  return res.blob() as unknown as Promise<T>
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
  profile: () => request<StudentProfile>("/api/student/profile"),

  grades: () => request<Grade[]>("/api/student/grades"),

  schedule: (from: string, to: string) =>
    request<ScheduleLesson[]>(`/api/student/schedule?from=${from}&to=${to}`),

  lesson: (lessonId: string) =>
    request<LessonDetail>(`/api/student/lessons/${lessonId}`),

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

  createSession: (lessonId: string, gameType: string) =>
    request<GameSession>("/api/games/sessions", {
      method: "POST",
      body: JSON.stringify({ lessonId, gameType }),
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
    request<GameSession[]>(`/api/games/lessons/${lessonId}/sessions`),

  // PvP
  createPvp: (lessonId: string, gameType: string) =>
    request<GameSession>("/api/games/pvp/create", {
      method: "POST",
      body: JSON.stringify({ lessonId, gameType }),
    }),

  openPvp: (lessonId: string) =>
    request<GameSession[]>(`/api/games/pvp/lessons/${lessonId}/open`),

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
    groupId: string
    subjectId: string
    lessonType: string
    gameType?: string
    startsAt: string
    endsAt: string
  }) =>
    request<AdminLesson>("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify(data),
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
  lessonType: "LECTURE" | "LAB_TASK" | "LAB_GAME" | "LAB_CODE" | "EXAM"
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
