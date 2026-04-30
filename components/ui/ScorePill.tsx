import type { CSSProperties } from "react";

export interface ScorePillProps {
  value: number;
}

function pillStyle(value: number): CSSProperties {
  if (value >= 80) {
    return {
      background: "rgba(6,214,160,.15)",
      color: "#06D6A0",
      border: "1px solid rgba(6,214,160,.3)",
    };
  }
  if (value >= 50) {
    return {
      background: "rgba(123,92,240,.15)",
      color: "#9B7CF0",
      border: "1px solid rgba(123,92,240,.3)",
    };
  }
  if (value >= 30) {
    return {
      background: "rgba(255,183,3,.15)",
      color: "#FFB703",
      border: "1px solid rgba(255,183,3,.3)",
    };
  }
  return {
    background: "rgba(255,107,53,.15)",
    color: "#FF6B35",
    border: "1px solid rgba(255,107,53,.3)",
  };
}

export function ScorePill({ value }: Readonly<ScorePillProps>) {
  return (
    <span
      className="inline-flex font-medium"
      style={{
        fontSize: 11,
        padding: "2px 10px",
        borderRadius: 20,
        fontWeight: 500,
        ...pillStyle(value),
      }}
    >
      {value}
    </span>
  );
}
