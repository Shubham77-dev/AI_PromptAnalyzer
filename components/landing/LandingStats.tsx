export interface LandingStatPack {
  analyses: string;
  prompts: string;
  users: string;
  avg: string;
}

export function LandingStats({ stats }: Readonly<{ stats: LandingStatPack }>) {
  const items: { v: string; l: string; c: string }[] = [
    { v: stats.analyses, l: "Analyses run", c: "var(--pa-acc1)" },
    { v: stats.prompts, l: "Prompts shared", c: "var(--pa-acc2)" },
    { v: stats.users, l: "Users", c: "var(--pa-acc3)" },
    { v: stats.avg, l: "Avg score", c: "var(--pa-acc4)" },
  ];
  return (
    <div className="mx-auto mt-5 grid w-full max-w-[560px] grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((x) => (
        <div key={x.l} className="pa-card px-3 py-3 text-center">
          <div className="text-lg font-medium tabular-nums" style={{ color: x.c }}>
            {x.v}
          </div>
          <div className="mt-0.5 text-[10px]" style={{ color: "var(--pa-muted)" }}>
            {x.l}
          </div>
        </div>
      ))}
    </div>
  );
}
