"use client";

import {
  addSetlistCustomItem,
  addSetlistSection,
  addSetlistSong,
  deleteSetlist,
  duplicateSetlist,
  removeSetlistItem,
  renameSetlistItem,
  reorderSetlistItems,
  updateSetlistName,
} from "@/app/actions/setlists";
import { SongPicker, type SongPickerOption } from "@/components/setlists/song-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { cn, formatDuration } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Plus, Rows3, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

export interface SetlistItemData {
  id: string;
  title: string;
  subtitle?: string;
  notes?: string | null;
  songId?: string | null;
  /** Разделитель блока («Блок 1», «Бис») */
  isSection?: boolean;
  durationSec?: number;
}

/** Номер внутри блока и сводка по блокам — нумерация начинается заново после разделителя. */
function useBlocks(items: SetlistItemData[]) {
  return useMemo(() => {
    const numbers = new Map<string, number>();
    const blocks = new Map<string, { count: number; durationSec: number }>();
    let current: string | null = null;
    let n = 0;
    for (const item of items) {
      if (item.isSection) {
        current = item.id;
        blocks.set(item.id, { count: 0, durationSec: 0 });
        n = 0;
        continue;
      }
      n += 1;
      numbers.set(item.id, n);
      if (current) {
        const b = blocks.get(current)!;
        b.count += 1;
        b.durationSec += item.durationSec ?? 0;
      }
    }
    return { numbers, blocks };
  }, [items]);
}

function SortableRow({
  item,
  children,
  className,
}: {
  item: SetlistItemData;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn("flex items-center gap-2", className)}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-text-muted hover:text-accent"
        aria-label="Перетащить"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </li>
  );
}

function SectionHeader({
  item,
  summary,
  onRename,
  onRemove,
}: {
  item: SetlistItemData;
  summary?: { count: number; durationSec: number };
  onRename: (title: string) => void;
  onRemove: () => void;
}) {
  // Компонент перемонтируется по key при смене названия с сервера
  const [title, setTitle] = useState(item.title);

  return (
    <SortableRow item={item} className="mt-3 border-b border-border-strong pb-1.5 pt-1 first:mt-0">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (title.trim() && title !== item.title) onRename(title);
          else setTitle(item.title);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label="Название блока"
        className="min-w-0 flex-1 bg-transparent font-display text-sm font-bold uppercase tracking-wide outline-none focus:text-accent"
      />
      {summary && (
        <span className="shrink-0 text-xs text-text-muted">
          {summary.count} тр.
          {summary.durationSec > 0 && ` · ${formatDuration(summary.durationSec)}`}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="text-text-muted hover:text-red"
        aria-label={`Убрать блок «${item.title}» (треки останутся)`}
        title="Убрать разделитель — треки останутся"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </SortableRow>
  );
}

export function SetlistEditor({
  setlistId,
  setlistName,
  bandSlug,
  initialItems,
  songs,
}: {
  setlistId: string;
  setlistName: string;
  bandSlug: string;
  initialItems: SetlistItemData[];
  songs: SongPickerOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState(setlistName);
  const [customTitle, setCustomTitle] = useState("");
  const { numbers, blocks } = useBlocks(items);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const usedSongIds = useMemo(
    () => new Set(items.map((i) => i.songId).filter((id): id is string => !!id)),
    [items]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    startTransition(async () => {
      await reorderSetlistItems(setlistId, bandSlug, reordered.map((i) => i.id));
      router.refresh();
    });
  }

  function handleAddSong(songId: string) {
    startTransition(async () => {
      const res = await addSetlistSong(setlistId, bandSlug, songId);
      if (!res.ok) showToast("error", res.error ?? "Не удалось добавить");
      router.refresh();
    });
  }

  function handleAddCustom() {
    if (!customTitle.trim()) return;
    startTransition(async () => {
      await addSetlistCustomItem(setlistId, bandSlug, customTitle);
      setCustomTitle("");
      router.refresh();
    });
  }

  function handleAddSection(title?: string) {
    startTransition(async () => {
      const res = await addSetlistSection(setlistId, bandSlug, title);
      if (!res.ok) showToast("error", res.error ?? "Не удалось добавить блок");
      router.refresh();
    });
  }

  function handleRename(itemId: string, title: string) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, title } : i)));
    startTransition(async () => {
      await renameSetlistItem(itemId, setlistId, bandSlug, title);
      router.refresh();
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeSetlistItem(itemId, setlistId, bandSlug);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      router.refresh();
    });
  }

  function handleNameBlur() {
    if (name.trim() && name !== setlistName) {
      startTransition(() => updateSetlistName(setlistId, bandSlug, name.trim()));
    }
  }

  function handleDeleteSetlist() {
    if (!confirm(`Удалить сет-лист «${name}»?`)) return;
    startTransition(() => deleteSetlist(setlistId, bandSlug));
  }

  function handleDuplicate() {
    startTransition(() => duplicateSetlist(setlistId, bandSlug));
  }

  const hasSections = items.some((i) => i.isSection);

  return (
    <div className={cn(pending && "pointer-events-none opacity-70")}>
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          aria-label="Название сет-листа"
          className="flex-1 text-base font-medium"
        />
        <Button
          type="button"
          variant="default"
          disabled={pending}
          onClick={handleDuplicate}
          title="Сделать копию"
          aria-label="Сделать копию сет-листа"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={pending}
          className="text-red hover:border-red hover:text-red"
          onClick={handleDeleteSetlist}
          aria-label="Удалить сет-лист"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Добавление — над списком */}
      <div className="mb-4 space-y-2 rounded-xl border border-dashed border-border p-3 sm:p-4">
        <SongPicker songs={songs} usedIds={usedSongIds} onPick={handleAddSong} disabled={pending} />
        <div className="flex flex-wrap gap-2">
          <div className="flex min-w-[220px] flex-1 gap-2">
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustom();
              }}
              placeholder="Вставка: Intro, приветствие…"
              aria-label="Вставка"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              onClick={handleAddCustom}
              disabled={!customTitle.trim()}
              className="shrink-0"
              aria-label="Добавить вставку"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" onClick={() => handleAddSection()} className="shrink-0">
            <Rows3 className="h-4 w-4" />
            Блок
          </Button>
          <Button type="button" onClick={() => handleAddSection("Бис")} className="shrink-0">
            <Plus className="h-4 w-4" />
            Бис
          </Button>
        </div>
        {!hasSections && items.length > 0 && (
          <p className="text-xs text-text-muted">
            «Блок» делит сет-лист на части — нумерация треков начнётся заново, у каждого блока своя
            длительность.
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-sm text-text-secondary">
          Найдите трек в поиске выше или добавьте вставку
        </p>
      ) : (
        <DndContext
          id={`setlist-${setlistId}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {items.map((item) =>
                item.isSection ? (
                  <SectionHeader
                    key={`${item.id}:${item.title}`}
                    item={item}
                    summary={blocks.get(item.id)}
                    onRename={(title) => handleRename(item.id, title)}
                    onRemove={() => handleRemove(item.id)}
                  />
                ) : (
                  <SortableRow
                    key={item.id}
                    item={item}
                    className="rounded-lg border border-border bg-bg-2 px-3 py-2.5"
                  >
                    <span className="w-5 text-right text-xs tabular-nums text-text-muted">
                      {numbers.get(item.id)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-text-secondary">{item.subtitle}</div>
                      )}
                      {item.notes && <div className="text-xs text-accent">{item.notes}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-text-muted hover:text-red"
                      aria-label={`Убрать «${item.title}» из сет-листа`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </SortableRow>
                )
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
