import { JsonLd } from "@/components/seo/json-ld";

export const HOME_FAQ = [
  {
    q: "Что значит «бета»?",
    a: "Всё уже работает, и всё бесплатно. Мы активно дорабатываем BandOS по отзывам первых групп: нашли ошибку или не хватает функции — напишите через «Обратную связь» в меню. Ответим на каждое сообщение, а статус доработки будет виден там же.",
  },
  {
    q: "Сколько стоит BandOS?",
    a: "Сервис бесплатный: все функции — репертуар, сет-листы, режим «Играем», график, финансы и публичная страница — доступны без оплаты.",
  },
  {
    q: "Нужно ли устанавливать приложение?",
    a: "Нет. BandOS работает в браузере на компьютере и телефоне. На телефоне его можно добавить на главный экран — откроется как обычное приложение.",
  },
  {
    q: "Работает ли режим «Играем» без интернета?",
    a: "Да. Открытый сет-лист сохраняется на устройстве, и на сцене его можно листать без связи. Экран при этом не гаснет.",
  },
  {
    q: "Что видит каждый музыкант в режиме «Играем»?",
    a: "Материал для своего инструмента: гитаристы и клавишники — аккорды, басист — табы, вокалист — текст, барабанщик — структуру и метроном.",
  },
  {
    q: "Как заказчику найти группу и связаться с ней?",
    a: "В каталоге на главной — группы с открытой страницей: описание, жанр, город, репертуар, техрайдер и контакты. Регистрироваться для просмотра не нужно, заявку на выступление можно отправить прямо со страницы группы.",
  },
  {
    q: "Как попасть в каталог групп?",
    a: "Зарегистрируйтесь, создайте группу и включите публичную страницу в профиле группы — она появится в каталоге и в поиске.",
  },
] as const;

export function HomeFaq() {
  return (
    <section id="faq" className="scroll-mt-16 pb-20 sm:pb-28">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <h2 className="heading-poster text-[34px] leading-[0.92] sm:text-6xl">Вопросы</h2>
        <div className="border-t border-border">
          {HOME_FAQ.map(({ q, a }, i) => (
            <details key={q} className="group border-b border-border py-5" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="font-display text-2xl leading-none text-accent transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-text-secondary">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
