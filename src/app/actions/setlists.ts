"use server";

import {
  requireBandPermission,
  requireSetlistMember,
} from "@/lib/band/assert-access";
import { bandPath } from "@/lib/paths";
import { revalidatePath } from "next/cache";
import { redirectWithToast } from "@/lib/redirect-with-toast";
import { redirect } from "next/navigation";

export async function createSetlist(bandId: string, bandSlug: string, formData: FormData) {
  const { supabase } = await requireBandPermission(bandId, "setlists");
  const name = (formData.get("name") as string).trim();

  if (!name) {
    await redirectWithToast(bandPath(bandSlug, "setlists", "new"), "Укажите название");
    return;
  }

  const { data, error } = await supabase
    .from("setlists")
    .insert({ band_id: bandId, name })
    .select("id")
    .single();

  if (error || !data) {
    await redirectWithToast(
      bandPath(bandSlug, "setlists", "new"),
      error?.message ?? "Ошибка"
    );
    return;
  }

  revalidatePath(bandPath(bandSlug, "setlists"));
  redirect(bandPath(bandSlug, "setlists", data.id));
}

export async function updateSetlistName(
  setlistId: string,
  bandSlug: string,
  name: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase.from("setlists").update({ name }).eq("id", setlistId);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function deleteSetlist(setlistId: string, bandSlug: string) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase.from("setlists").delete().eq("id", setlistId);
  revalidatePath(bandPath(bandSlug, "setlists"));
  redirect(bandPath(bandSlug, "setlists"));
}

async function nextPosition(
  supabase: Awaited<ReturnType<typeof requireSetlistMember>>["supabase"],
  setlistId: string
) {
  const { data: items } = await supabase
    .from("setlist_items")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1);
  return (items?.[0]?.position ?? -1) + 1;
}

/** Трек в конец сет-листа (со страницы сет-листа и из меню трека в «Треках»). */
export async function addSetlistSong(
  setlistId: string,
  bandSlug: string,
  songId: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, bandId } = await requireSetlistMember(setlistId);

  const { data: song } = await supabase
    .from("songs")
    .select("id")
    .eq("id", songId)
    .eq("band_id", bandId)
    .maybeSingle();
  if (!song) return { ok: false, error: "Трек не найден" };

  const { error } = await supabase.from("setlist_items").insert({
    setlist_id: setlistId,
    song_id: songId,
    position: await nextPosition(supabase, setlistId),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
  revalidatePath(bandPath(bandSlug, "setlists"));
  revalidatePath(bandPath(bandSlug, "songs"));
  return { ok: true };
}

/**
 * Разделитель блока в конец сет-листа. Без названия — «Блок N». Первый блок
 * в непустом сет-листе: треки выше него оборачиваются в «Блок 1».
 */
export async function addSetlistSection(
  setlistId: string,
  bandSlug: string,
  title?: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireSetlistMember(setlistId);

  const { data: existing, error: readError } = await supabase
    .from("setlist_items")
    .select("position, is_section")
    .eq("setlist_id", setlistId)
    .order("position");
  if (readError) {
    return {
      ok: false,
      error: readError.message.includes("is_section")
        ? "Блоки появятся после обновления базы (миграция 032)"
        : readError.message,
    };
  }

  const items = existing ?? [];
  const sections = items.filter((i) => i.is_section).length;
  const wrapLeading = sections === 0 && items.length > 0 && !items[0].is_section;
  const name =
    title?.trim().slice(0, 80) || `Блок ${sections + (wrapLeading ? 2 : 1)}`;

  const rows: Record<string, unknown>[] = [];
  if (wrapLeading) {
    rows.push({
      setlist_id: setlistId,
      title: "Блок 1",
      is_section: true,
      position: items[0].position - 1,
    });
  }
  rows.push({
    setlist_id: setlistId,
    title: name,
    is_section: true,
    position: items.length ? items[items.length - 1].position + 1 : 0,
  });

  const { error } = await supabase.from("setlist_items").insert(rows);
  if (error) {
    return {
      ok: false,
      error: error.message.includes("is_section")
        ? "Блоки появятся после обновления базы (миграция 032)"
        : error.message,
    };
  }

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
  return { ok: true };
}

/** Переименовать блок или вставку. */
export async function renameSetlistItem(
  itemId: string,
  setlistId: string,
  bandSlug: string,
  title: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  const name = title.trim().slice(0, 80);
  if (!name) return;
  await supabase
    .from("setlist_items")
    .update({ title: name })
    .eq("id", itemId)
    .eq("setlist_id", setlistId)
    .is("song_id", null);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

/** Копия сет-листа со всеми треками, вставками и блоками — открывается сразу. */
export async function duplicateSetlist(setlistId: string, bandSlug: string) {
  const { supabase, bandId } = await requireSetlistMember(setlistId);

  const { data: source } = await supabase
    .from("setlists")
    .select("name")
    .eq("id", setlistId)
    .maybeSingle();
  if (!source) {
    await redirectWithToast(bandPath(bandSlug, "setlists"), "Сет-лист не найден");
    return;
  }

  const { data: copy, error } = await supabase
    .from("setlists")
    .insert({ band_id: bandId, name: `${source.name} (копия)`.slice(0, 200) })
    .select("id")
    .single();
  if (error || !copy) {
    await redirectWithToast(bandPath(bandSlug, "setlists"), error?.message ?? "Не удалось скопировать");
    return;
  }

  // select("*"): is_section есть только после миграции 032 — копируем то, что есть
  const { data: items } = await supabase
    .from("setlist_items")
    .select("*")
    .eq("setlist_id", setlistId)
    .order("position");

  if (items?.length) {
    const rows = items.map((item) => {
      const row = { ...item, setlist_id: copy.id } as Record<string, unknown>;
      delete row.id;
      delete row.created_at;
      return row;
    });
    const { error: itemsError } = await supabase.from("setlist_items").insert(rows);
    if (itemsError) {
      await supabase.from("setlists").delete().eq("id", copy.id);
      await redirectWithToast(bandPath(bandSlug, "setlists"), itemsError.message);
      return;
    }
  }

  revalidatePath(bandPath(bandSlug, "setlists"));
  await redirectWithToast(bandPath(bandSlug, "setlists", copy.id), "Копия создана", "success");
}

export async function addSetlistCustomItem(
  setlistId: string,
  bandSlug: string,
  title: string,
  notes?: string
) {
  const { supabase } = await requireSetlistMember(setlistId);

  await supabase.from("setlist_items").insert({
    setlist_id: setlistId,
    title: title.trim(),
    notes: notes?.trim() || null,
    position: await nextPosition(supabase, setlistId),
  });

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function removeSetlistItem(
  itemId: string,
  setlistId: string,
  bandSlug: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase
    .from("setlist_items")
    .delete()
    .eq("id", itemId)
    .eq("setlist_id", setlistId);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function reorderSetlistItems(
  setlistId: string,
  bandSlug: string,
  orderedIds: string[]
) {
  const { supabase } = await requireSetlistMember(setlistId);
  // Каждый id — отдельный запрос: ограничиваем, чтобы не нагрузить БД.
  if (!Array.isArray(orderedIds) || orderedIds.length > 300) return;

  await Promise.all(
    orderedIds.map((id, position) =>
      supabase
        .from("setlist_items")
        .update({ position })
        .eq("id", id)
        .eq("setlist_id", setlistId)
    )
  );

  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}

export async function updateSetlistItemNotes(
  itemId: string,
  setlistId: string,
  bandSlug: string,
  notes: string
) {
  const { supabase } = await requireSetlistMember(setlistId);
  await supabase
    .from("setlist_items")
    .update({ notes: notes.trim().slice(0, 500) || null })
    .eq("id", itemId)
    .eq("setlist_id", setlistId);
  revalidatePath(bandPath(bandSlug, "setlists", setlistId));
}
