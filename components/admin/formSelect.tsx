import { SelectHTMLAttributes } from "react";

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function FormSelect({ className, children, ...props }: FormSelectProps) {
  return (
    <select
      {...props}
      className={`
        w-full
        rounded-2xl
        border border-zinc-800
        bg-zinc-900
        px-4 py-3
        outline-none
        transition
        focus:border-indigo-500
        focus:ring-2
        focus:ring-indigo-500/20
        text-white
        ${className || ""}
      `}
    >
      {children}
    </select>
  );
}
