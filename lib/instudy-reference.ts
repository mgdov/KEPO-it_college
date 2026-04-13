export type AnnouncementCategory = "important" | "webinars" | "news" | "development"

export interface AnnouncementItem {
  id: string
  date: string
  title: string
  category: AnnouncementCategory
}

export const announcementItems: AnnouncementItem[] = [
  { id: "1", date: "24 марта 2026", title: "Вакансия менеджера по работе с абитуриентами", category: "news" },
  { id: "2", date: "24 марта 2026", title: "Вакансия заместителя начальника отдела кадров", category: "news" },
  { id: "3", date: "24 марта 2026", title: "Вакансия в АУП", category: "news" },
  { id: "4", date: "23 марта 2026", title: "Мастер-класс по медиации 26 марта в 12:00", category: "news" },
  { id: "5", date: "13 марта 2026", title: "Диктант по курсу Основы российской государственности", category: "news" },
  { id: "6", date: "6 марта 2026", title: "Сервис психологической помощи Точка Опоры", category: "important" },
  { id: "7", date: "3 марта 2026", title: "День открытых дверей 25.03.2026", category: "news" },
  { id: "8", date: "13 января 2026", title: "Академическая задолженность", category: "important" },
]

export const extracurricularTopics: string[] = [
  "Антикоррупционная политика",
  "Войска беспилотных систем России",
  "Здоровье, здоровый образ жизни и охрана труда обучающихся",
  "Коронавирус (COVID-19)",
  "Мастер-классы",
  "Профилактика правонарушений",
  "Социокультурная среда Академии",
]

export const documentFolders: string[] = [
  "Инструкция по работе на платформе",
  "Учебные планы и рабочие программы дисциплин",
  "Положения",
  "Бланки заявлений",
  "Расписания",
  "Документы для выпускников",
  "Оплата обучения",
  "Информация для первокурсника",
  "Результаты освоения образовательной программы",
]

export interface ExternalResource {
  name: string
  url: string
  note?: string
}

export const externalResources: ExternalResource[] = [
  { name: "IPRbooks", url: "https://www.iprbookshop.ru/", note: "Электронно-библиотечная система" },
  { name: "Гарант", url: "https://www.garant.ru/", note: "Информационно-правовой портал" },
  { name: "КонсультантПлюс", url: "https://www.consultant.ru/", note: "Правовая поддержка" },
  { name: "Открытое образование", url: "https://openedu.ru/", note: "Онлайн-курсы" },
  { name: "VK", url: "https://vk.com/", note: "Полезные ссылки и сообщества" },
]

export const portfolioSections: string[] = [
  "Карточка обучающегося",
  "Результаты промежуточного контроля по дисциплинам",
  "Курсовые проекты",
  "Материалы практик",
  "Научно-исследовательская работа",
  "Резюме",
  "Грамоты",
  "Свидетельства",
  "Удостоверения и дипломы",
  "Творческие работы",
]

export const requestTypes: string[] = [
  "Справка об обучении",
  "Справка для военкомата",
  "Справка о периоде обучения",
  "Заявление на академический отпуск",
  "Заявление на перевод",
]
