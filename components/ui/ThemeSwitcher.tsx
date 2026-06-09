"use client";

import { useTheme } from "@/context/ThemeContext";
import { THEME_LIST, themeLabel, type ThemeName } from "@/lib/themes";

const SWATCH_BG: Record<ThemeName, string> = {
  light: "linear-gradient(135deg,#534AB7,#7B5CF0)",
  aurora: "linear-gradient(135deg,#7B5CF0,#FF6B9D)",
  ocean: "linear-gradient(135deg,#00B4D8,#06D6A0)",
  sunset: "linear-gradient(135deg,#FF6B35,#FF006E)",
  forest: "linear-gradient(135deg,#06D6A0,#7B5CF0)",
};

export function ThemeSwitcher() {
  const { themeName, setTheme } = useTheme();

  return (
    <div className="flex flex-col px-2 pt-2" style={{ padding: "8px 8px 0" }}>
      <div className="mb-2 flex w-full items-center gap-2">
        {THEME_LIST.map((name) => {
          const active = name === themeName;
          return (
            <button
              key={name}
              type="button"
              title={themeLabel(name)}
              aria-pressed={active}
              onClick={() => setTheme(name)}
              className="shrink-0 rounded-full p-0"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: SWATCH_BG[name],
                border: active ? "2px solid var(--pa-text)" : "2px solid transparent",
                boxSizing: "border-box",
              }}
            />
          );
        })}
        <span
          className="ml-auto truncate font-medium"
          style={{ fontSize: 11, color: "var(--pa-text)" }}
        >
          {themeLabel(themeName)}
        </span>
      </div>
    </div>
  );
}
