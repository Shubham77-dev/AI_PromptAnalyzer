import { SuggestionItem } from "@/components/ui/SuggestionItem";

export function UploadSuggestionsBlock({
  issues,
  suggestions,
}: Readonly<{ issues: string[]; suggestions: string[] }>) {
  const rows = [
    ...issues.map((t) => ({ key: `i-${t}`, type: "warn" as const, title: "Issue", desc: t })),
    ...suggestions.map((t) => ({ key: `s-${t}`, type: "tip" as const, title: "Suggestion", desc: t })),
  ];
  return (
    <div>
      {rows.map((r, idx) => (
        <SuggestionItem
          key={r.key}
          type={r.type}
          title={r.title}
          desc={r.desc}
          hideBorder={idx === rows.length - 1}
        />
      ))}
    </div>
  );
}
