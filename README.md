# KEPO-it_college
# КЭПО — Колледж электронного и программного образования  
Онлайн-платформа дистанционного обучения с личными кабинетами и интерактивными занятиями

<p align="center">
  <img src="https://via.placeholder.com/1200x400/0033A0/FFFFFF?text=КЭПО+—+Личный+кабинет+студента" alt="КЭПО Banner" width="100%" />
  <br/>
  <em>Современная, удобная и строгая в стиле dstu.ru</em>
</p>

<p align="center">
  <a href="https://kepo-it-college.vercel.app">
    <img src="https://img.shields.io/badge/Открыть_демо-0066CC?style=for-the-badge&logo=vercel&logoColor=white" alt="Demo">
  </a>
  &nbsp;&nbsp;
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 15">
  <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcn&logoColor=white" alt="shadcn/ui">
</p>

## О проекте

**КЭПО** — это полноценная платформа дистанционного обучения для студентов колледжа.  
Студенты получают доступ к личному кабинету только после загрузки документов и одобрения администратором. Внутри — расписание, материалы лекций, интерактивные лабораторные занятия, тесты, экзамены и необычные модули физкультуры в игровом формате.

### Основные возможности

- 🛡️ Регистрация с загрузкой документов (паспорт, СНИЛС и др.)
- 👮 Три роли: Студент · Преподаватель · Администратор
- 📅 Умное расписание с блокировкой прошедших занятий
- 📚 Лекции — просмотр PDF/Word материалов
- 🎮 Лабораторные занятия:
  - Онлайн-компилятор (программирование)
  - Задачи с выбором ответа (математика и др.)
  - **Физкультура в играх**:
    - Шахматы
    - Шашки
    - Словесные игры
    - «Кто хочет стать миллионером»
    - Физминутки с анимациями
    - PvP и игра против компьютера + рейтинговая система
- 🏆 Система баллов и рейтинга по физкультуре
- 📊 Автоматический процент успеваемости
- 📝 Зачёты и экзамены в формате тестов
- 🔐 Жёсткий контроль доступа (занятие закрывается после окончания)

## Технологии

| Категория           | Технологии                                      |
|---------------------|--------------------------------------------------|
| Frontend            | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI-компоненты       | shadcn/ui, Lucide Icons, framer-motion           |
| Формы и валидация   | React Hook Form + Zod                            |
| Запросы к API       | TanStack Query (React Query)                     |
| Редактор кода       | Monaco Editor                                    |
| Шахматы             | chess.js + react-chessboard                      |
| Авторизация         | httpOnly cookie session                          |
| Деплой              | Vercel                                           |

## Структура проекта

```text
app/
├── (auth)/             # страницы авторизации
├── (student)/          # дашборд студента
│   ├── courses/        # Мои курсы
│   ├── physical-education/  # Игры по физкультуре
│   └── lessons/[id]/
├── (teacher)/          # дашборд преподавателя
│   ├── groups/
│   └── groups/[id]/schedule/
├── (admin)/            # админ-панель
components/
├── ui/                 # shadcn компоненты
├── layout/             # Sidebar, Header, Footer
lib/
├── api.ts              # typed API client
└── types/              # типы из API
