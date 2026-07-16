interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-[#0B0D19]">
      <div
        className={`w-full max-w-md flex flex-col min-h-screen p-4 justify-between ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
