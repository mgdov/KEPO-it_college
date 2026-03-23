
import type {
  MeResponse,
  StudentProfile,
  Grade,
  ScheduleLesson,
  LessonDetail,
  AdminUser,
  Group,
  Subject,
  AdminLesson,
  AuditLog,
} from "@/lib/api"


export const MOCK_USERS: Record<
  string,
  { password: string; me: MeResponse }
> = {
  student: {
    password: "student123",
    me: {
      id: "u-student-1",
      email: "ivanov@kepo.ru",
      role: "STUDENT",
      login: "student",
      fullName: "Иванов Иван Иванович",
      student: { id: "s-1", groupId: "g-1" },
    },
  },
  teacher: {
    password: "teacher123",
    me: {
      id: "u-teacher-1",
      email: "petrov@kepo.ru",
      role: "TEACHER",
      login: "teacher",
      fullName: "Петров Алексей Сергеевич",
    },
  },
  admin: {
    password: "admin123",
    me: {
      id: "u-admin-1",
      email: "admin@kepo.ru",
      role: "ADMIN",
      login: "admin",
      fullName: "Администратор КЭПО",
    },
  },
}


export const MOCK_PROFILE: StudentProfile = {
  id: "u-student-1",
  fullName: "Иванов Иван Иванович",
  email: "ivanov@kepo.ru",
  login: "student",
  student: {
    id: "s-1",
    group: {
      id: "g-1",
      name: "ИТ-21",
      course: 3,
      specialty: "Информационные технологии",
    },
  },
}


export const MOCK_GRADES: Grade[] = [
  {
    lessonId: "l-1",
    lessonTitle: "Введение в программирование",
    subjectName: "Информатика",
    score: 92,
    maxScore: 100,
    gradedAt: "2025-02-10T10:00:00Z",
  },
  {
    lessonId: "l-2",
    lessonTitle: "Базы данных: основы SQL",
    subjectName: "Базы данных",
    score: 78,

    maxScore: 100,
    gradedAt: "2025-02-17T10:00:00Z",
  },
  {
    lessonId: "l-3",
    lessonTitle: "Алгоритмы и структуры данных",
    subjectName: "Информатика",
    score: 85,
    maxScore: 100,
    gradedAt: "2025-02-24T10:00:00Z",
  },
  {
    lessonId: "l-4",
    lessonTitle: "Сети и протоколы",
    subjectName: "Сетевые технологии",
    score: 60,
    maxScore: 100,
    gradedAt: "2025-03-03T10:00:00Z",
  },
  {
    lessonId: "l-5",
    lessonTitle: "Веб-разработка: HTML/CSS",
    subjectName: "Веб-технологии",
    score: 95,
    maxScore: 100,
    gradedAt: "2025-03-10T10:00:00Z",
  },
]


const today = new Date()
function dayOffset(d: number, h: number, m = 0) {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + d)
  dt.setHours(h, m, 0, 0)
  return dt.toISOString()
}

export const MOCK_SCHEDULE: ScheduleLesson[] = [
  {
    id: "l-1",
    lessonType: "LECTURE",
    startsAt: dayOffset(0, 8, 0),
    endsAt: dayOffset(0, 9, 30),
    subject: { id: "sub-1", name: "Информатика", code: "INF" },
    isLocked: false,
  },
  {
    id: "l-2",
    lessonType: "LAB_CODE",
    startsAt: dayOffset(0, 10, 0),
    endsAt: dayOffset(0, 11, 30),
    subject: { id: "sub-2", name: "Базы данных", code: "DB" },
    isLocked: false,
  },
  {
    id: "l-3",
    lessonType: "LAB_GAME",
    gameType: "MILLIONAIRE",
    startsAt: dayOffset(1, 8, 0),
    endsAt: dayOffset(1, 9, 30),
    subject: { id: "sub-3", name: "Сетевые технологии", code: "NET" },
    isLocked: false,
  },
  {
    id: "l-4",
    lessonType: "LECTURE",
    startsAt: dayOffset(1, 10, 0),
    endsAt: dayOffset(1, 11, 30),
    subject: { id: "sub-4", name: "Веб-технологии", code: "WEB" },
    isLocked: false,
  },
  {
    id: "l-5",
    lessonType: "EXAM",
    startsAt: dayOffset(2, 9, 0),
    endsAt: dayOffset(2, 11, 0),
    subject: { id: "sub-1", name: "Информатика", code: "INF" },
    isLocked: true,
  },
  {
    id: "l-6",
    lessonType: "LAB_TASK",
    startsAt: dayOffset(3, 8, 0),
    endsAt: dayOffset(3, 9, 30),
    subject: { id: "sub-2", name: "Базы данных", code: "DB" },
    isLocked: false,
  },
  {
    id: "l-7",
    lessonType: "LAB_GAME",
    gameType: "CHESS",
    startsAt: dayOffset(4, 10, 0),
    endsAt: dayOffset(4, 11, 30),
    subject: { id: "sub-3", name: "Сетевые технологии", code: "NET" },
    isLocked: false,
  },
]


export const MOCK_LESSON_DETAIL: Record<string, LessonDetail> = {
  "l-1": {
    id: "l-1",
    lessonType: "LECTURE",
    startsAt: dayOffset(0, 8, 0),
    endsAt: dayOffset(0, 9, 30),
    subject: { id: "sub-1", name: "Информатика", code: "INF" },
    isLocked: false,
    materials: [
      {
        id: "m-1",
        title: "Лекция 1 — Введение в программирование",
        description: "Основные понятия, алгоритмы, псевдокод",
        fileUrl: "#",
        fileName: "lecture1.pdf",
        fileType: "application/pdf",
        createdAt: "2025-01-15T08:00:00Z",
      },
      {
        id: "m-2",
        title: "Презентация к лекции",
        fileUrl: "#",
        fileName: "slides1.pptx",
        fileType: "application/vnd.ms-powerpoint",
        createdAt: "2025-01-15T08:00:00Z",
      },
    ],
    assessment: {
      id: "a-1",
      title: "Тест по теме «Введение»",
      assessmentType: "QUIZ",
      passingScore: 60,
      maxAttempts: 3,
      durationMinutes: 20,
      isPublished: true,
      lessonId: "l-1",
    },
  },
  "l-2": {
    id: "l-2",
    lessonType: "LAB_CODE",
    startsAt: dayOffset(0, 10, 0),
    endsAt: dayOffset(0, 11, 30),
    subject: { id: "sub-2", name: "Базы данных", code: "DB" },
    isLocked: false,
    materials: [
      {
        id: "m-3",
        title: "Задание: SQL запросы",
        description: "Написать SELECT, JOIN, GROUP BY запросы",
        fileUrl: "#",
        fileName: "lab2.pdf",
        fileType: "application/pdf",
        createdAt: "2025-01-22T10:00:00Z",
      },
    ],
    programmingTask: {
      id: "pt-1",
      lessonId: "l-2",
      title: "Сумма элементов массива",
      statement:
        "Дан массив целых чисел. Выведите сумму всех его элементов.\n\n**Входные данные:** первая строка — n (количество элементов), вторая — n чисел через пробел.\n\n**Выходные данные:** одно целое число — сумма.",
      allowedLanguages: ["python", "javascript", "c"],
      testCases: [
        { input: "5\n1 2 3 4 5", expected: "15" },
        { input: "3\n10 -5 3", expected: "8" },
        { input: "1\n42", expected: "42" },
      ],
      timeLimitMs: 2000,
      memoryLimitKb: 65536,
      maxAttempts: 10,
    },
  },
  "l-3": {
    id: "l-3",
    lessonType: "LAB_GAME",
    gameType: "MILLIONAIRE",
    startsAt: dayOffset(1, 8, 0),
    endsAt: dayOffset(1, 9, 30),
    subject: { id: "sub-3", name: "Сетевые технологии", code: "NET" },
    isLocked: false,
    materials: [],
  },
  "l-7": {
    id: "l-7",
    lessonType: "LAB_GAME",
    gameType: "CHESS",
    startsAt: dayOffset(4, 10, 0),
    endsAt: dayOffset(4, 11, 30),
    subject: { id: "sub-3", name: "Сетевые технологии", code: "NET" },
    isLocked: false,
    materials: [],
  },
}


export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "u-student-1",
    email: "ivanov@kepo.ru",
    fullName: "Иванов Иван Иванович",
    login: "student",
    role: "STUDENT",
    createdAt: "2024-09-01T08:00:00Z",
    student: { id: "s-1", group: { id: "g-1", name: "ИТ-21" } },
  },
  {
    id: "u-student-2",
    email: "sidorova@kepo.ru",
    fullName: "Сидорова Мария Петровна",
    login: "sidorova_mp",
    role: "STUDENT",
    createdAt: "2024-09-01T08:00:00Z",
    student: { id: "s-2", group: { id: "g-1", name: "ИТ-21" } },
  },
  {
    id: "u-student-3",
    email: "kozlov@kepo.ru",
    fullName: "Козлов Дмитрий Андреевич",
    login: "kozlov_da",
    role: "STUDENT",
    createdAt: "2024-09-01T08:00:00Z",
    student: { id: "s-3", group: { id: "g-2", name: "ЭК-22" } },
  },
  {
    id: "u-teacher-1",
    email: "petrov@kepo.ru",
    fullName: "Петров Алексей Сергеевич",
    login: "teacher",
    role: "TEACHER",
    createdAt: "2023-08-15T08:00:00Z",
  },
  {
    id: "u-admin-1",
    email: "admin@kepo.ru",
    fullName: "Администратор КЭПО",
    login: "admin",
    role: "ADMIN",
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "u-pending-1",
    email: "novikov@mail.ru",
    fullName: "Новиков Артём Витальевич",
    role: "PENDING",
    createdAt: "2025-03-17T14:22:00Z",
  },
]

export const MOCK_GROUPS: Group[] = [
  { id: "g-1", name: "ИТ-21", course: 3, specialty: "Информационные технологии" },
  { id: "g-2", name: "ЭК-22", course: 2, specialty: "Экономика и бухгалтерский учёт" },
  { id: "g-3", name: "ПР-23", course: 1, specialty: "Право и организация социального обеспечения" },
]

export const MOCK_SUBJECTS: Subject[] = [
  { id: "sub-1", name: "Информатика", code: "INF" },
  { id: "sub-2", name: "Базы данных", code: "DB" },
  { id: "sub-3", name: "Сетевые технологии", code: "NET" },
  { id: "sub-4", name: "Веб-технологии", code: "WEB" },
  { id: "sub-5", name: "Экономика", code: "ECO" },
  { id: "sub-6", name: "Право", code: "LAW" },
]

export const MOCK_LESSONS: AdminLesson[] = [
  {
    id: "l-1",
    lessonType: "LECTURE",
    startsAt: dayOffset(0, 8, 0),
    endsAt: dayOffset(0, 9, 30),
    subject: MOCK_SUBJECTS[0],
    group: MOCK_GROUPS[0],
  },
  {
    id: "l-2",
    lessonType: "LAB_CODE",
    startsAt: dayOffset(0, 10, 0),
    endsAt: dayOffset(0, 11, 30),
    subject: MOCK_SUBJECTS[1],
    group: MOCK_GROUPS[0],
  },
  {
    id: "l-3",
    lessonType: "LAB_GAME",
    gameType: "MILLIONAIRE",
    startsAt: dayOffset(1, 8, 0),
    endsAt: dayOffset(1, 9, 30),
    subject: MOCK_SUBJECTS[2],
    group: MOCK_GROUPS[0],
  },
  {
    id: "l-4",
    lessonType: "LECTURE",
    startsAt: dayOffset(1, 10, 0),
    endsAt: dayOffset(1, 11, 30),
    subject: MOCK_SUBJECTS[3],
    group: MOCK_GROUPS[1],
  },
  {
    id: "l-5",
    lessonType: "EXAM",
    startsAt: dayOffset(2, 9, 0),
    endsAt: dayOffset(2, 11, 0),
    subject: MOCK_SUBJECTS[0],
    group: MOCK_GROUPS[0],
  },
]

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "al-1",
    actorUserId: "u-admin-1",
    actorName: "Администратор КЭПО",
    action: "APPROVE_USER",
    entityType: "User",
    entityId: "u-student-1",
    createdAt: "2024-09-01T09:15:00Z",
  },
  {
    id: "al-2",
    actorUserId: "u-admin-1",
    actorName: "Администратор КЭПО",
    action: "CREATE_GROUP",
    entityType: "Group",
    entityId: "g-1",
    createdAt: "2024-08-20T10:00:00Z",
  },
  {
    id: "al-3",
    actorUserId: "u-admin-1",
    actorName: "Администратор КЭПО",
    action: "CREATE_LESSON",
    entityType: "Lesson",
    entityId: "l-1",
    createdAt: "2025-03-01T08:30:00Z",
  },
  {
    id: "al-4",
    actorUserId: "u-teacher-1",
    actorName: "Петров Алексей Сергеевич",
    action: "PUBLISH_ASSESSMENT",
    entityType: "Assessment",
    entityId: "a-1",
    createdAt: "2025-03-10T11:00:00Z",
  },
  {
    id: "al-5",
    actorUserId: "u-admin-1",
    actorName: "Администратор КЭПО",
    action: "APPROVE_USER",
    entityType: "User",
    entityId: "u-student-2",
    createdAt: "2024-09-01T09:20:00Z",
  },
]
