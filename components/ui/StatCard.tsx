export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accentColor: string;
  subColor?: string;
}

export function StatCard({ label, value, sub, accentColor, subColor }: Readonly<StatCardProps>) {
  return (
    <div
      className="pa-card-transition relative"
      style={{
        background: "var(--pa-card)",
        border: "1px solid var(--pa-card-border)",
        borderRadius: 10,
        padding: "12px 14px 12px 18px",
      }}
    >
      <span
        aria-hidden
        className="absolute bottom-2 left-0 top-2"
        style={{
          width: 3,
          borderRadius: "2px 0 0 2px",
          background: accentColor,
        }}
      />
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          color: "var(--pa-muted)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 22,
          fontWeight: 500,
          color: "var(--pa-text)",
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ marginTop: 3, fontSize: 10, color: subColor ?? "var(--pa-acc2)" }}>{sub}</div>
      ) : null}
    </div>
  );
}
