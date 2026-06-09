"use client";

/** TEMPORARY BANNER — remove after 30 days or after password reset flow is implemented */
export function DefaultPasswordBanner() {
  return (
    <div
      className="mb-4 rounded-lg px-3 py-2.5"
      style={{
        background: "rgba(59,130,246,0.1)",
        border: "1px solid rgba(59,130,246,0.25)",
        fontSize: 11,
        lineHeight: 1.5,
        color: "var(--pa-text)",
      }}
      role="status"
    >
      <span style={{ fontWeight: 600 }}>ℹ️ Existing users:</span> your default password is{" "}
      <code style={{ fontFamily: "var(--font-geist-mono), monospace" }}>Analyzer@123</code>. We recommend
      changing it after login.
    </div>
  );
}
