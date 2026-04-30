"use client";

export interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}

function SearchIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden style={{ color: "var(--pa-muted)" }}>
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 9L12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SearchBar({ placeholder, value, onChange }: Readonly<SearchBarProps>) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        background: "var(--pa-card)",
        border: "1px solid var(--pa-card-border)",
        borderRadius: 10,
        padding: "7px 12px",
      }}
    >
      <SearchIcon />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pa-search-input min-w-0 flex-1 border-0 bg-transparent outline-none"
        style={{ fontSize: 12, color: "var(--pa-text)" }}
      />
    </div>
  );
}
