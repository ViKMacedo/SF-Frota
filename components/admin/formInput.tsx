import { InputHTMLAttributes } from "react";

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FormInput({ className, ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={`
        w-full
        rounded-2xl
        border border-zinc-800
        text-white
        bg-zinc-900
        px-4 py-3
        outline-none
        transition
        focus:border-indigo-500
        focus:ring-2
        focus:ring-indigo-500/20
        placeholder:text-zinc-500
        ${className || ""}
      `}
    />
  );
}
