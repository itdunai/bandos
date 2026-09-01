"use client";

import { createContext, useContext } from "react";

const BuildShaContext = createContext("dev");

export function BuildShaProvider({
  sha,
  children,
}: {
  sha: string;
  children: React.ReactNode;
}) {
  return (
    <BuildShaContext.Provider value={sha}>{children}</BuildShaContext.Provider>
  );
}

export function useBuildSha() {
  return useContext(BuildShaContext);
}
