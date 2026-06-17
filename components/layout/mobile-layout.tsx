interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div
      className={`min-h-screen flex justify-center p-6 ${className ?? "bg-gradient-to-b from-indigo-950 to-indigo-900"}`}
    >
      <div className="w-full max-w-sm flex flex-col">{children}</div>
    </div>
  );
}
