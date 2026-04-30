"use client";

type Parsed = {
  issues: string[];
  suggestions: string[];
  improvedPrompt: string | null;
};

export function parseSuggestionsText(text: string): Parsed {
  const lines = text.split(/\r?\n/);
  const lower = lines.map((l) => l.trim());

  const issuesIdx = lower.findIndex((l) => /^issues:/i.test(l));
  const suggIdx = lower.findIndex((l) => /^suggestions:/i.test(l));
  const improvedIdx = lower.findIndex((l) => /^improved prompt:/i.test(l));

  const listFrom = (start: number, end: number) =>
    lines
      .slice(start, end)
      .map((l) => l.trim())
      .filter((l) => l.startsWith("- "))
      .map((l) => l.slice(2).trim())
      .filter(Boolean);

  let issuesEnd = lines.length;
  if (suggIdx >= 0) issuesEnd = suggIdx;
  else if (improvedIdx >= 0) issuesEnd = improvedIdx;

  let suggEnd = lines.length;
  if (improvedIdx >= 0) suggEnd = improvedIdx;

  const issues = issuesIdx >= 0 ? listFrom(issuesIdx + 1, issuesEnd) : [];
  const suggestions = suggIdx >= 0 ? listFrom(suggIdx + 1, suggEnd) : [];

  const improvedPrompt =
    improvedIdx >= 0 ? lines.slice(improvedIdx + 1).join("\n").trim() || null : null;

  return { issues, suggestions, improvedPrompt };
}

function Dot({ color }: Readonly<{ color: string }>) {
  return <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export function SuggestionsPanel({
  suggestionsText,
}: Readonly<{
  suggestionsText: string;
}>) {
  const parsed = parseSuggestionsText(suggestionsText);
  const label = parsed.issues.length ? "Issues detected" : "Suggestions";

  return (
    <div className="mt-4 rounded-xl p-4" style={{ border: "1px solid var(--pa-card-border)", background: "var(--pa-card)" }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
        {label}
      </div>

      <div className="mt-3 grid gap-2">
        {(parsed.issues.length ? parsed.issues : parsed.suggestions).slice(0, 12).map((t) => (
          <div key={t} className="flex gap-2 text-sm" style={{ color: "var(--pa-text)" }}>
            <Dot color={parsed.issues.length ? "var(--pa-acc4)" : "var(--pa-acc1)"} />
            <div className="min-w-0">{t}</div>
          </div>
        ))}
      </div>

      {parsed.improvedPrompt ? (
        <div className="mt-4">
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "var(--pa-muted)" }}>
            Improved prompt preview
          </div>
          <pre
            className="mt-2 whitespace-pre-wrap rounded-lg p-3 font-mono text-[12px]"
            style={{ background: "var(--pa-hint)", color: "var(--pa-text)" }}
          >
            {parsed.improvedPrompt}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
