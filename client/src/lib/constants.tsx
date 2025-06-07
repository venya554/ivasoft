import React from 'react';

// Компоненты иконок для услуг
const ServiceIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-white text-5xl">
    {children}
  </div>
);

export const SERVICES = [
  {
    title: "Разработка программного обеспечения",
    description: "Создаем кастомное ПО для решения бизнес-задач: от небольших утилит до сложных корпоративных систем.",
    icon: (
      <ServiceIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
          <polyline points="17 12 12 7 7 12"></polyline>
        </svg>
      </ServiceIcon>
    )
  },
  {
    title: "Мобильные приложения",
    description: "Разрабатываем нативные и кроссплатформенные приложения для iOS и Android с современным дизайном.",
    icon: (
      <ServiceIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      </ServiceIcon>
    )
  },
  {
    title: "Веб-разработка",
    description: "Создаем современные веб-сайты и веб-приложения с адаптивным дизайном и оптимальной производительностью.",
    icon: (
      <ServiceIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </ServiceIcon>
    )
  },
  {
    title: "AI и Big Data",
    description: "Внедряем технологии искусственного интеллекта и анализа больших данных для оптимизации бизнес-процессов.",
    icon: (
      <ServiceIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </ServiceIcon>
    )
  },
  {
    title: "Системная интеграция",
    description: "Объединяем разные системы и программные решения в единую экосистему для эффективной работы.",
    icon: (
      <ServiceIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
      </ServiceIcon>
    )
  },
  {
    title: "Техническая поддержка",
    description: "Обеспечиваем непрерывную работу ваших IT-систем и оперативно решаем возникающие проблемы.",
    icon: (
      <ServiceIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </ServiceIcon>
    )
  }
];

export const PORTFOLIO_ITEMS = [
  {
    id: "fintrack-pro",
    title: "FinTrack Pro",
    tags: "Мобильные приложения, Финтех",
    image: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    shortDescription: "Разработка кроссплатформенного мобильного приложения для управления личными финансами с аналитикой и прогнозированием расходов.",
    fullDescription: "Мобильное приложение для персонального финансового учета с функциями аналитики, прогнозирования и планирования бюджета. Приложение разработано для iOS и Android с использованием React Native.",
    tasks: [
      "Создание интуитивно понятного интерфейса для учета доходов и расходов",
      "Разработка модуля аналитики с визуализацией данных",
      "Внедрение алгоритмов прогнозирования финансовых потоков",
      "Обеспечение безопасности данных пользователей",
      "Интеграция с банковскими API"
    ],
    technologies: [
      "React Native",
      "Redux",
      "Node.js",
      "MongoDB",
      "Chart.js",
      "Plaid API"
    ],
    results: "Приложение было успешно запущено на рынок и за первый месяц привлекло более 10 000 пользователей. Средняя оценка в App Store и Google Play составляет 4.8 из 5 звезд."
  },
  {
    id: "retailinsight",
    title: "RetailInsight",
    tags: "Веб-разработка, Big Data",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
    shortDescription: "Разработка системы бизнес-аналитики для розничной сети с предиктивным анализом спроса и оптимизацией запасов.",
    fullDescription: "Веб-система для комплексного анализа бизнес-показателей розничной сети с функциями предиктивной аналитики и оптимизации управления запасами. Система развернута в облаке и интегрирована с существующей ERP-системой клиента.",
    tasks: [
      "Разработка информационных панелей для мониторинга ключевых показателей",
      "Создание системы предиктивного анализа спроса на основе исторических данных",
      "Внедрение алгоритмов оптимизации запасов и цепочек поставок",
      "Интеграция с существующими системами клиента",
      "Обеспечение масштабируемости для обработки больших объемов данных"
    ],
    technologies: [
      "React.js",
      "Python",
      "Django",
      "PostgreSQL",
      "Apache Kafka",
      "TensorFlow",
      "AWS"
    ],
    results: "Внедрение системы позволило клиенту снизить затраты на управление запасами на 15% и увеличить точность прогнозирования спроса до 93%. Время принятия управленческих решений сократилось на 40%."
  },
  {
    id: "logiflow",
    title: "LogiFlow",
    tags: "Программное обеспечение, Логистика",
    image: "https://pixabay.com/get/g06f8d8feb265b16539388060002a5bc53f7915040a95275ea69caa31fabb42ec41c40ae92739869b6ac433e37d8a66dcc1f8c7db3396aa5aabde032b59103f8e_1280.jpg",
    shortDescription: "Создание комплексного решения для управления логистическими процессами с оптимизацией маршрутов и отслеживанием в реальном времени.",
    fullDescription: "Комплексное программное решение для управления логистическими процессами транспортной компании. Система включает функции планирования маршрутов, отслеживания грузов в реальном времени и оптимизации загрузки транспорта.",
    tasks: [
      "Разработка модуля для автоматического планирования оптимальных маршрутов",
      "Создание системы отслеживания местоположения транспорта в реальном времени",
      "Внедрение алгоритмов оптимизации загрузки транспортных средств",
      "Разработка мобильного приложения для водителей",
      "Интеграция с существующими системами учета и документооборота"
    ],
    technologies: [
      "C#",
      ".NET Core",
      "Angular",
      "SQL Server",
      "Google Maps API",
      "SignalR",
      "Flutter"
    ],
    results: "Внедрение системы позволило клиенту сократить расходы на логистику на 20% и уменьшить время доставки на 15%. Эффективность использования транспортных средств увеличилась на 25%."
  }
];
