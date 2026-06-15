"use client";

import { toggleTodo, deleteTodo, updateTodo } from "@/app/actions/todos";
import { TodoFormFields } from "@/components/todos/todo-form-fields";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Todo } from "@/types/database";
import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

function DueBadge({ dueDate, isDone }: { dueDate: string; isDone: boolean }) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const overdue = !isDone && due < today;
  const soon =
    !isDone &&
    !overdue &&
    due.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000;

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        overdue && "bg-red/12 text-red",
        soon && !overdue && "bg-amber/12 text-amber",
        !overdue && !soon && "bg-bg-3 text-text-muted"
      )}
    >
      {formatDate(dueDate, { day: "numeric", month: "short" })}
    </span>
  );
}

function TodoItem({
  todo,
  bandSlug,
  canEdit,
}: {
  todo: Todo;
  bandSlug: string;
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const action = updateTodo.bind(null, todo.id, bandSlug);

  if (editing && canEdit) {
    return (
      <li className="rounded-lg border border-accent/40 bg-bg-2 p-4">
        <form
          action={(fd) =>
            startTransition(async () => {
              await action(fd);
              setEditing(false);
            })
          }
          className="space-y-3"
        >
          <TodoFormFields todo={todo} />
          <div className="flex gap-2">
            <Button type="submit" variant="accent" size="sm" loading={pending} disabled={pending}>
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Отмена
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group rounded-lg border border-border bg-bg-2 transition-colors hover:border-accent/50",
        pending && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        {canEdit ? (
          <button
            type="button"
            onClick={() =>
              startTransition(() => toggleTodo(todo.id, bandSlug, !todo.is_done))
            }
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              todo.is_done
                ? "border-green bg-green"
                : "border-border hover:border-accent"
            )}
            aria-label={todo.is_done ? "Отметить неготовым" : "Отметить готовым"}
          >
            {todo.is_done && <span className="text-[8px] text-bg">✓</span>}
          </button>
        ) : (
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
              todo.is_done ? "border-green bg-green" : "border-border"
            )}
          >
            {todo.is_done && <span className="text-[8px] text-bg">✓</span>}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                todo.is_done && "text-text-muted line-through"
              )}
            >
              {todo.title}
            </span>
            {todo.due_date && (
              <DueBadge dueDate={todo.due_date} isDone={todo.is_done} />
            )}
          </div>
          {todo.description && (
            <p
              className={cn(
                "mt-1 text-xs text-text-secondary",
                todo.is_done && "line-through opacity-70"
              )}
            >
              {todo.description}
            </p>
          )}
          {todo.notes && (
            <p className="mt-1 text-[11px] text-text-muted italic">
              {todo.notes}
            </p>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-1 text-text-muted hover:text-accent"
              aria-label="Редактировать"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Удалить задачу?")) {
                  startTransition(() => deleteTodo(todo.id, bandSlug));
                }
              }}
              className="p-1 text-text-muted hover:text-red"
              aria-label="Удалить"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function TodoList({
  todos,
  bandSlug,
  filter,
  canEdit = true,
}: {
  todos: Todo[];
  bandSlug: string;
  filter: "all" | "open" | "done";
  canEdit?: boolean;
}) {
  const filtered = todos.filter((t) => {
    if (filter === "open") return !t.is_done;
    if (filter === "done") return t.is_done;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        {filter === "open" ? "Всё готово!" : "Пока пусто"}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {filtered.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          bandSlug={bandSlug}
          canEdit={canEdit}
        />
      ))}
    </ul>
  );
}
