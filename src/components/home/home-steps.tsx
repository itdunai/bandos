const STEPS = [
  {
    title: "Создайте группу",
    text: "Регистрация за минуту. Группа сразу получает примеры треков и сет-листа — видно, как всё устроено. Дальше добавляйте свои.",
  },
  {
    title: "Позовите своих",
    text: "Ссылка-приглашение и права: кто правит репертуар, кто ведёт график и кассу.",
  },
  {
    title: "Выходите на сцену",
    text: "Сет-лист в телефоне у каждого, а заказчику — публичная страница с техрайдером.",
  },
] as const;

export function HomeSteps() {
  return (
    <section id="how" className="scroll-mt-16 pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="heading-poster mb-10 text-[34px] leading-[0.92] sm:text-6xl">
          Три шага
          <br />
          до сцены
        </h2>
        <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative overflow-hidden rounded-md border border-border bg-bg-2 p-7"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 -top-8 font-display text-[150px] font-black leading-none text-accent/10"
              >
                {i + 1}
              </span>
              <h3 className="relative font-sans text-xl font-bold">{step.title}</h3>
              <p className="relative mt-2 leading-relaxed text-text-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
