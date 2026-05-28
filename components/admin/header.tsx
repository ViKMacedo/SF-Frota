interface HeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-zinc-500 mt-2">{description}</p>
      </div>
      {action}
    </div>
  );
}
