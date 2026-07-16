import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
  variant?: "default" | "primary" | "glass";
}

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col rounded-3xl border transition-all duration-200",

        size === "default" && "p-5",
        size === "sm" && "p-4",

        variant === "default" && [
          "border-zinc-800",
          "bg-zinc-900",
          "shadow-[0_8px_30px_rgba(0,0,0,.18)]",
        ],

        variant === "primary" && [
          "border-indigo-700/60",
          "bg-gradient-to-br",
          "from-indigo-900",
          "via-[#302a79]",
          "to-[#25205f]",
          "shadow-[0_8px_30px_rgba(0,0,0,.22)]",
        ],

        variant === "glass" && [
          "border-zinc-700/60",
          "bg-zinc-900/70",
          "backdrop-blur-xl",
          "shadow-[0_8px_30px_rgba(0,0,0,.18)]",
        ],

        className,
      )}
      {...props}
    />
  );
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        `
        grid
        auto-rows-min
        items-start
        gap-1
        rounded-t-xl
        px-4

        has-data-[slot=card-action]:grid-cols-[1fr_auto]
        has-data-[slot=card-description]:grid-rows-[auto_auto]

        group-data-[size=sm]/card:px-3
        [.border-b]:pb-4
        group-data-[size=sm]/card:[.border-b]:pb-3
        `,
        className,
      )}
      {...props}
    />
  );
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        `
        font-semibold
        leading-none
        tracking-tight

        text-lg

        group-data-[size=sm]/card:text-base
        `,
        className,
      )}
      {...props}
    />
  );
}
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-zinc-500", className)}
      {...props}
    />
  );
}
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  );
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        `
        flex
        items-center
        rounded-b-xl
        border-t
        p-4

        group-data-[size=sm]/card:p-3

        group-data-[variant=default]/card:border-zinc-800
        group-data-[variant=default]/card:bg-zinc-900

        group-data-[variant=primary]/card:border-white/10
        group-data-[variant=primary]/card:bg-black/10

        group-data-[variant=glass]/card:border-zinc-700/40
        group-data-[variant=glass]/card:bg-transparent
        `,
        className,
      )}
      {...props}
    />
  );
}
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
};
