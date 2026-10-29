"use client";

import type { Band, Event } from "@/types/database";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const BandShellContext = createContext<Band[]>([]);
const UpcomingEventContext = createContext<Event | null>(null);
const UnreadFeedbackContext = createContext<{ count: number; clear: () => void }>({
  count: 0,
  clear: () => {},
});

export function BandShellProvider({
  userBands,
  upcomingEvent,
  unreadFeedback = 0,
  children,
}: {
  userBands: Band[];
  upcomingEvent?: Event | null;
  /** Обращения с ответом, которые пользователь ещё не видел */
  unreadFeedback?: number;
  children: React.ReactNode;
}) {
  // Сброс помним для конкретного значения с сервера: появится новый ответ — индикатор вернётся
  const [clearedFor, setClearedFor] = useState<number | null>(null);
  const clear = useCallback(() => setClearedFor(unreadFeedback), [unreadFeedback]);
  const unread = useMemo(
    () => ({ count: clearedFor === unreadFeedback ? 0 : unreadFeedback, clear }),
    [clearedFor, unreadFeedback, clear]
  );

  return (
    <BandShellContext.Provider value={userBands}>
      <UpcomingEventContext.Provider value={upcomingEvent ?? null}>
        <UnreadFeedbackContext.Provider value={unread}>{children}</UnreadFeedbackContext.Provider>
      </UpcomingEventContext.Provider>
    </BandShellContext.Provider>
  );
}

export function useUserBands() {
  return useContext(BandShellContext);
}

export function useUpcomingEvent() {
  return useContext(UpcomingEventContext);
}

export function useUnreadFeedback() {
  return useContext(UnreadFeedbackContext).count;
}

export function useClearUnreadFeedback() {
  return useContext(UnreadFeedbackContext).clear;
}
