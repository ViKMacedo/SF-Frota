import { LabelHTMLAttributes, ReactNode } from "react";

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function FormLabel({ children, ...props }: FormLabelProps) {
  return (
    <label className="text-sm text-zinc-400 font-medium" {...props}>
      {children}
    </label>
  );
}
