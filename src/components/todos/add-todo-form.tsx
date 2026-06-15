"use client";

import { createTodo } from "@/app/actions/todos";
import { TodoFormFields } from "@/components/todos/todo-form-fields";
import { Button } from "@/components/ui/button";
import { PendingOverlay } from "@/components/ui/pending-overlay";
import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";

export function AddTodoForm({
  bandId,
  bandSlug,
}: {
  bandId: string;
  bandSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const action = createTodo.bind(null, bandId, bandSlug);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      formRef.current?.reset();
      setExpanded(false);
    });
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-bg-2 px-3 py-2.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        Добавить задачу
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-xl border border-border bg-bg-2 p-4 space-y-3"
    >
      <PendingOverlay pending={pending} label="Добавление…">
      <TodoFormFields />
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="accent" loading={pending} disabled={pending}>
          {pending ? "Добавление…" : "Добавить"}
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={pending}
          onClick={() => setExpanded(false)}
        >
          Отмена
        </Button>
      </div>
      </PendingOverlay>
    </form>
  );
}
