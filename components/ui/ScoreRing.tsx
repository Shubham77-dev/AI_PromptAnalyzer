export interface ScoreRingProps {
  score: number;
}

export function ScoreRing({ score }: Readonly<ScoreRingProps>) {
  const v = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid place-items-center rounded-full"
        style={{
          width: 72,
          height: 72,
          border: "3px solid var(--pa-acc1)",
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 500, color: "var(--pa-acc1)" }}>{v}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 10, color: "var(--pa-muted)" }}>overall score</div>
    </div>
  );
}
