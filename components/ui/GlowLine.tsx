export function GlowLine() {
  return (
    <div
      aria-hidden
      style={{
        marginBottom: 16,
        height: 2,
        background: "var(--pa-grad)",
        borderRadius: 2,
        opacity: 0.7,
        animation: "pa-glow 2s ease infinite",
      }}
    />
  );
}
