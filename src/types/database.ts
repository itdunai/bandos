export type MemberRole = "admin" | "member" | "manager" | "session";
export type Instrument = "guitar" | "bass" | "drums" | "vocals" | "keys" | "other";
export type SongStatus = "ready" | "in_progress" | "demo" | "frozen";
export type SongType = "original" | "cover";

export const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"] as const;
export type TimeSignature = (typeof TIME_SIGNATURES)[number];
export type ContentType = "chords" | "tabs" | "lyrics" | "notes" | "structure";
export type EventType = "rehearsal" | "performance";
export type AttendanceStatus = "going" | "maybe" | "absent";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SocialLinks {
  vk?: string;
  telegram?: string;
  youtube?: string;
  instagram?: string;
  website?: string;
}

export interface Band {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  genre: string | null;
  logo_url: string | null;
  photos: string[];
  tech_rider: string | null;
  rider_public: boolean;
  repertoire_public: boolean;
  social_links: SocialLinks;
  finance_opening_balance?: number;
  created_by: string | null;
  created_at: string;
}

export type FinanceTransactionType = "income" | "expense";

export interface FinanceTransaction {
  id: string;
  band_id: string;
  transaction_type: FinanceTransactionType;
  amount: number;
  title: string;
  notes: string | null;
  event_id: string | null;
  transaction_at: string;
  created_by: string | null;
  created_at: string;
}

export const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
  vk: "ВКонтакте",
  telegram: "Telegram",
  youtube: "YouTube",
  instagram: "Instagram",
  website: "Сайт",
};

export type PermissionPreset =
  | "musician"
  | "editor"
  | "manager"
  | "administrator"
  | "custom";

export type BandPermissions = Partial<
  Record<
    | "songs"
    | "setlists"
    | "schedule"
    | "todos"
    | "band_profile"
    | "finances",
    boolean
  >
>;

export interface BandMember {
  id: string;
  band_id: string;
  user_id: string;
  role: MemberRole;
  instrument: Instrument;
  display_name: string | null;
  phone: string | null;
  telegram: string | null;
  is_active: boolean;
  permission_preset: PermissionPreset | null;
  permissions: BandPermissions;
}

export interface Song {
  id: string;
  band_id: string;
  title: string;
  status: SongStatus;
  bpm: number | null;
  time_signature: string;
  key: string | null;
  duration_sec: number | null;
  song_type: SongType;
  genre: string | null;
  structure: string | null;
  source_url: string | null;
  last_rehearsed_at: string | null;
}

export interface SongContent {
  id: string;
  song_id: string;
  content_type: ContentType;
  instrument: Instrument | null;
  body: string;
}

export interface SetlistItem {
  id: string;
  setlist_id: string;
  song_id: string | null;
  title: string | null;
  position: number;
  notes: string | null;
  duration_sec: number | null;
}

export interface Todo {
  id: string;
  band_id: string;
  title: string;
  description: string | null;
  notes: string | null;
  is_done: boolean;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
}

export interface Setlist {
  id: string;
  band_id: string;
  name: string;
}

export interface Event {
  id: string;
  band_id: string;
  event_type: EventType;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  setlist_id: string | null;
  organizer?: string | null;
  fee?: number | null;
}

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  guitar: "Гитара",
  bass: "Бас",
  drums: "Ударные",
  vocals: "Вокал",
  keys: "Клавиши",
  other: "Другое",
};

export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  ready: "Готова",
  in_progress: "В работе",
  demo: "Демо",
  frozen: "Заморожена",
};

export const SONG_TYPE_LABELS: Record<SongType, string> = {
  original: "Авторская",
  cover: "Кавер",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  member: "Member",
  manager: "Manager",
  session: "Session",
};
