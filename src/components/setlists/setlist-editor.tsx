"use client";

import {
  addSetlistCustomItem,
  addSetlistSong,
  deleteSetlist,
  removeSetlistItem,
  reorderSetlistItems,
  updateSetlistName,
} from "@/app/actions/setlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface SetlistItemData {
  id: string;
  title: string;
  subtitle?: string;
  notes?: string | null;
}

interface SongOption {
  id: string;
  title: string;
}

function SortableItem({
  item,
  index,
  onRemove,
}: {
  item: SetlistItemData;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-bg-2 px-3 py-2.5"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-text-muted hover:text-accent"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 text-right text-xs text-text-muted">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{item.title}</div>
        {item.subtitle && (
          <div className="text-[11px] text-text-secondary">{item.subtitle}</div>
        )}
        {item.notes && (
          <div className="text-[11px] text-accent">{item.notes}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-text-muted hover:text-red"
        aria-label="Удалить"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
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
  songs: SongOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState(setlistName);
  const [selectedSong, setSelectedSong] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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
      await reorderSetlistItems(
        setlistId,
        bandSlug,
        reordered.map((i) => i.id)
      );
      router.refresh();
    });
  }

  function handleAddSong() {
    if (!selectedSong) return;
    startTransition(async () => {
      await addSetlistSong(setlistId, bandSlug, selectedSong);
      setSelectedSong("");
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

  return (
    <div className={cn(pending && "pointer-events-none opacity-70")}>
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="flex-1 text-base font-medium"
        />
        <Button
          type="button"
          variant="default"
          loading={pending}
          disabled={pending}
          className="text-red hover:border-red hover:text-red"
          onClick={handleDeleteSetlist}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="mb-4 space-y-1.5">
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="mb-4 text-center text-sm text-text-secondary">
          Добавьте треки из библиотеки или вставку (Intro, бис...)
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <div className="flex gap-2">
          <select
            value={selectedSong}
            onChange={(e) => setSelectedSong(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-bg-3 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Выбрать трек...</option>
            {songs.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <Button type="button" variant="accent" onClick={handleAddSong} disabled={!selectedSong}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Вставка: Intro, бис..."
            className="flex-1"
          />
          <Button type="button" onClick={handleAddCustom} disabled={!customTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
