import { IconOk, IconTip, IconWarn } from "@/components/ui/SuggestionIcons";

export type SuggestionType = "warn" | "tip" | "ok";

export interface SuggestionItemProps {
  title: string;
  desc: string;
  type: SuggestionType;
  hideBorder?: boolean;
}

export function SuggestionItem({ title, desc, type, hideBorder }: Readonly<SuggestionItemProps>) {
  const iconColor =
    type === "warn" ? "var(--pa-acc4)" : type === "tip" ? "var(--pa-acc1)" : "var(--pa-acc2)";
  const Icon = type === "warn" ? IconWarn : type === "tip" ? IconTip : IconOk;
  return (
    <div
      className="flex gap-2"
      style={{
        gap: 8,
        padding: "9px 14px",
        borderBottom: hideBorder ? undefined : "1px solid var(--pa-card-border)",
      }}
    >
      <div
        className="grid shrink-0 place-items-center rounded-md"
        style={{ width: 20, height: 20, background: "var(--pa-hint)", color: iconColor }}
      >
        <Icon />
      </div>
      <div className="min-w-0">
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--pa-text)" }}>{title}</div>
        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            color: "var(--pa-muted)",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}
