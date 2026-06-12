"use server";

import {
  requireBandPermission,
  requireTodoMember,
} from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { revalidatePath } from "next/cache";

function parseTodoForm(formData: FormData) {
  const dueRaw = (formData.get("due_date") as string) || "";
  return {
    title: (formData.get("title") as string).trim(),
    description: (formData.get("description") as string).trim() || null,
    notes: (formData.get("notes") as string).trim() || null,
    due_date: dueRaw || null,
  };
}

export async function toggleTodo(todoId: string, bandSlug: string, isDone: boolean) {
  const { supabase } = await requireTodoMember(todoId);
  await supabase.from("todos").update({ is_done: isDone }).eq("id", todoId);
  revalidatePath(bandPath(bandSlug, "todos"));
}

export async function createTodo(bandId: string, bandSlug: string, formData: FormData) {
  const { supabase } = await requireBandPermission(bandId, "todos");
  const data = parseTodoForm(formData);

  if (!data.title) return;

  await supabase.from("todos").insert({
    band_id: bandId,
    title: data.title,
    description: data.description,
    notes: data.notes,
    due_date: data.due_date,
  });

  revalidatePath(bandPath(bandSlug, "todos"));
}

export async function updateTodo(todoId: string, bandSlug: string, formData: FormData) {
  const { supabase } = await requireTodoMember(todoId);
  const data = parseTodoForm(formData);

  if (!data.title) return;

  await supabase
    .from("todos")
    .update({
      title: data.title,
      description: data.description,
      notes: data.notes,
      due_date: data.due_date,
    })
    .eq("id", todoId);

  revalidatePath(bandPath(bandSlug, "todos"));
}

export async function deleteTodo(todoId: string, bandSlug: string) {
  const { supabase } = await requireTodoMember(todoId);
  await supabase.from("todos").delete().eq("id", todoId);
  revalidatePath(bandPath(bandSlug, "todos"));
}
