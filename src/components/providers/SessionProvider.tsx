"use client";

import { createContext, useContext } from "react";
import { can, type Capability } from "@/lib/permissions";

const RoleContext = createContext<string>("client");

export function SessionProvider({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

export function useCan(capability: Capability) {
  return can(useContext(RoleContext), capability);
}
