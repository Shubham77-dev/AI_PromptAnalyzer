"use client";

import { useTheme } from "@/context/ThemeContext";
import { THEME_LIST, themeLabel, type ThemeName } from "@/lib/themes";

const PREVIEW: Record<ThemeName, string> = {
  light: "linear-gradient(135deg,#534AB7,#7B5CF0)",
  aurora: "linear-gradient(135deg,#7B5CF0,#FF6B9D)",
  ocean: "linear-gradient(135deg,#00B4D8,#06D6A0)",
  sunset: "linear-gradient(135deg,#FF6B35,#FF006E)",
  forest: "linear-gradient(135deg,#06D6A0,#7B5CF0)",
};

export function ThemeSection() {
  const { themeName, setTheme } = useTheme();

  return (
    <div>
      <div className="mb-3 font-medium" style={{ fontSize: 13, color: "var(--pa-text)" }}>
        Color theme
      </div>
      <div className="grid grid-cols-2 gap-3">
        {THEME_LIST.map((name) => {
          const active = name === themeName;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setTheme(name)}
              className="cursor-pointer text-center font-medium text-white transition-transform"
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                background: PREVIEW[name],
                border: active ? "2px solid var(--pa-text)" : "2px solid transparent",
                transform: active ? "scale(1.02)" : "none",
              }}
            >
              {themeLabel(name)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
