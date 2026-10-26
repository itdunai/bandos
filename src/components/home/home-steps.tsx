const STEPS = [
  {
    title: "Создайте группу",
    text: "Регистрация за минуту. Добавьте треки с BPM, тональностью, аккордами и текстами — или импортируйте список.",
  },
  {
    title: "Пригласите участников",
    text: "Отправьте ссылку-приглашение и назначьте права: кто редактирует репертуар, кто ведёт график и финансы.",
  },
  {
    title: "Играйте",
    text: "Соберите сет-лист, откройте режим «Играем» на сцене, а заказчикам отправьте публичную страницу с техрайдером.",
  },
] as const;

export function HomeSteps() {
  return (
    <section id="how" className="scroll-mt-16 border-b border-border py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="heading-poster mb-10 text-2xl sm:text-3xl">Как это работает</h2>
        <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-bg-2 p-6">
              <span className="font-display text-4xl font-extrabold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
