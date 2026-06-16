"use client";

import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useRef } from "react";

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = next;
  const cursor = start + before.length + selected.length + after.length;
  textarea.focus();
  textarea.setSelectionRange(
    selected ? cursor : start + before.length,
    selected ? cursor : start + before.length
  );
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function prefixLines(textarea: HTMLTextAreaElement, prefix: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const block = value.slice(lineStart, end);
  const lines = block.split("\n");
  const prefixed = lines.map((line) => (line ? `${prefix}${line}` : line)).join("\n");
  const next = value.slice(0, lineStart) + prefixed + value.slice(end);
  textarea.value = next;
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

export function MinimalEditor({
  name,
  defaultValue = "",
  rows = 8,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function run(action: (el: HTMLTextAreaElement) => void) {
    const el = textareaRef.current;
    if (!el) return;
    action(el);
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-bg-3", className)}>
      <div className="flex flex-wrap gap-0.5 border-b border-border p-1">
        <ToolbarButton
          label="Жирный"
          onClick={() => run((el) => wrapSelection(el, "**"))}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Курсив"
          onClick={() => run((el) => wrapSelection(el, "*"))}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Список"
          onClick={() => run((el) => prefixLines(el, "- "))}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Нумерованный список"
          onClick={() => run((el) => prefixLines(el, "1. "))}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full resize-y bg-transparent px-3 py-2 text-sm outline-none font-mono"
      />
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-text-secondary hover:bg-bg-2 hover:text-text-primary"
    >
      {children}
    </button>
  );
}

/** Простой рендер **жирного**, *курсива* и списков */
export function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1 text-sm leading-relaxed text-text-primary">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-text-muted">•</span>
              <span>{formatInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="min-w-[1.25rem] text-text-muted">{numbered[1]}.</span>
              <span>{formatInline(numbered[2])}</span>
            </div>
          );
        }
        if (!trimmed) return <div key={i} className="h-2" />;
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++}>{token.slice(2, -2)}</strong>
      );
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}
