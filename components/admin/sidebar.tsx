"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  href: string;
  label: string;
}

export function Sidebar({ href, label }: SidebarProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        flex items-center
        px-4 py-3 rounded-2xl
        transition-all duration-200
        font-medium
        ${
          isActive
            ? "bg-indigo-600 text-white"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
        }
      `}
    >
      {label}
    </Link>
  );
}
