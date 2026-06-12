"use client";

import type { Band, Event } from "@/types/database";
import { createContext, useContext } from "react";

const BandShellContext = createContext<Band[]>([]);
const UpcomingEventContext = createContext<Event | null>(null);

export function BandShellProvider({
  userBands,
  upcomingEvent,
  children,
}: {
  userBands: Band[];
  upcomingEvent?: Event | null;
  children: React.ReactNode;
}) {
  return (
    <BandShellContext.Provider value={userBands}>
      <UpcomingEventContext.Provider value={upcomingEvent ?? null}>
        {children}
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
