import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Todo } from "@/types/database";

export function TodoFormFields({ todo }: { todo?: Todo }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Задача *</Label>
        <Input
          name="title"
          required
          defaultValue={todo?.title}
          placeholder="Записать бас-партии"
        />
      </div>
      <div>
        <Label>Описание</Label>
        <Textarea
          name="description"
          rows={2}
          defaultValue={todo?.description ?? ""}
          placeholder="Что нужно сделать, детали..."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Срок</Label>
          <Input
            name="due_date"
            type="date"
            defaultValue={todo?.due_date ?? ""}
          />
        </div>
      </div>
      <div>
        <Label>Заметки</Label>
        <Textarea
          name="notes"
          rows={2}
          defaultValue={todo?.notes ?? ""}
          placeholder="Ссылки, напоминания, контекст..."
        />
      </div>
    </div>
  );
}
