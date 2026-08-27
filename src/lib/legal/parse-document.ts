export type InlineSpan =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string };

export type DocumentBlock =
  | { type: "h1" | "h2" | "h3"; spans: InlineSpan[] }
  | { type: "p"; spans: InlineSpan[] }
  | { type: "ul"; items: InlineSpan[][] }
  | { type: "ol"; items: { n: string; spans: InlineSpan[] }[] }
  | { type: "spacer" };

const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const UL_RE = /^[-*]\s+(.+)$/;
const OL_RE = /^(\d+)\.\s+(.+)$/;

export function parseInline(text: string): InlineSpan[] {
  const parts: InlineSpan[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push({ type: "strong", value: token.slice(2, -2) });
    } else {
      parts.push({ type: "em", value: token.slice(1, -1) });
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}

export function parseDocument(text: string): DocumentBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: DocumentBlock[] = [];
  let ulItems: InlineSpan[][] = [];
  let olItems: { n: string; spans: InlineSpan[] }[] = [];

  const flushLists = () => {
    if (ulItems.length) {
      blocks.push({ type: "ul", items: ulItems });
      ulItems = [];
    }
    if (olItems.length) {
      blocks.push({ type: "ol", items: olItems });
      olItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushLists();
      if (blocks.at(-1)?.type !== "spacer") {
        blocks.push({ type: "spacer" });
      }
      continue;
    }

    const heading = trimmed.match(HEADING_RE);
    if (heading) {
      flushLists();
      const tag = heading[1].length === 1 ? "h1" : heading[1].length === 2 ? "h2" : "h3";
      blocks.push({ type: tag, spans: parseInline(heading[2]) });
      continue;
    }

    const ul = trimmed.match(UL_RE);
    if (ul) {
      if (olItems.length) {
        blocks.push({ type: "ol", items: olItems });
        olItems = [];
      }
      ulItems.push(parseInline(ul[1]));
      continue;
    }

    const ol = trimmed.match(OL_RE);
    if (ol) {
      if (ulItems.length) {
        blocks.push({ type: "ul", items: ulItems });
        ulItems = [];
      }
      olItems.push({ n: ol[1], spans: parseInline(ol[2]) });
      continue;
    }

    flushLists();
    blocks.push({ type: "p", spans: parseInline(trimmed) });
  }

  flushLists();
  while (blocks[0]?.type === "spacer") blocks.shift();
  while (blocks.at(-1)?.type === "spacer") blocks.pop();
  return blocks;
}
