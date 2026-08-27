import { parseDocument, type InlineSpan } from "@/lib/legal/parse-document";

function Inline({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        if (span.type === "strong") {
          return <strong key={i}>{span.value}</strong>;
        }
        if (span.type === "em") {
          return <em key={i}>{span.value}</em>;
        }
        return <span key={i}>{span.value}</span>;
      })}
    </>
  );
}

/** Безопасный рендер разметки без HTML: заголовки, списки, **жирный**, *курсив*. */
export function FormattedDocument({ text }: { text: string }) {
  const blocks = parseDocument(text);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
      {blocks.map((block, i) => {
        if (block.type === "spacer") {
          return <div key={i} className="h-2" />;
        }
        if (block.type === "h1") {
          return (
            <h1
              key={i}
              className="text-2xl font-medium leading-snug text-text-primary"
            >
              <Inline spans={block.spans} />
            </h1>
          );
        }
        if (block.type === "h2") {
          return (
            <h2
              key={i}
              className="pt-2 text-lg font-medium leading-snug text-text-primary"
            >
              <Inline spans={block.spans} />
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3
              key={i}
              className="text-base font-medium text-text-primary"
            >
              <Inline spans={block.spans} />
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-text-muted">•</span>
                  <span>
                    <Inline spans={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i} className="space-y-1.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="min-w-[1.25rem] text-text-muted">
                    {item.n}.
                  </span>
                  <span>
                    <Inline spans={item.spans} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            <Inline spans={block.spans} />
          </p>
        );
      })}
    </div>
  );
}
