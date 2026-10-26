import { JsonLd } from "@/components/seo/json-ld";
import { ChevronDown } from "lucide-react";

export const HOME_FAQ = [
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
    <section id="faq" className="scroll-mt-16 border-b border-border py-14 sm:py-16">
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="heading-poster mb-8 text-2xl sm:text-3xl">Вопросы и ответы</h2>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-2">
          {HOME_FAQ.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold transition-colors hover:bg-bg-3 [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
