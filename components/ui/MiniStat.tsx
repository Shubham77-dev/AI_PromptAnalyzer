export interface MiniStatProps {
  value: string;
  label: string;
  valueColor: string;
}

export function MiniStat({ value, label, valueColor }: Readonly<MiniStatProps>) {
  return (
    <div className="pa-card px-3 py-3 text-center">
      <div className="text-lg font-medium tabular-nums" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px]" style={{ color: "var(--pa-muted)" }}>
        {label}
      </div>
    </div>
  );
}
