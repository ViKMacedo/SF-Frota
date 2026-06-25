"use client";

import { ReactNode } from "react";
import { AutoSync } from "@/components/AutoSync";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DriverLayout({ children }: { children: ReactNode }) {
  useAuthGuard("driver");

  return (
    <>
      <AutoSync />
      {children}
    </>
  );
}
