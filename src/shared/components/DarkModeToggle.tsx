import { useState, useCallback } from "react";
import { saveDarkMode, readDarkMode } from "../storage";
import Icon from "./Icon";

export type DarkModeTheme = {
  dark: boolean;
  toggleDark: () => void;
  bg: string;
  text: string;
  cardBg: string;
  border: string;
  subText: string;
};

export function useDarkMode(defaultDark: boolean): DarkModeTheme {
  const [dark, setDark] = useState(() => readDarkMode(defaultDark));

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  }, []);

  const bg = dark ? "#10221f" : "#f8fcfb";
  const text = dark ? "#f3f4f6" : "#0d1b19";
  const cardBg = dark ? "#1a3632" : "#ffffff";
  const border = dark ? "rgba(76,154,141,.2)" : "rgba(76,154,141,.15)";
  const subText = dark ? "#9ca3af" : "rgba(13,27,25,.6)";

  return { dark, toggleDark, bg, text, cardBg, border, subText };
}

type DarkModeToggleProps = {
  dark: boolean;
  toggleDark: () => void;
  position?: "left" | "right";
  className?: string;
};

export default function DarkModeToggle({
  dark,
  toggleDark,
  position = "left",
  className = "",
}: DarkModeToggleProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={toggleDark}
      aria-label={dark ? "Açık tema" : "Koyu tema"}
      style={{
        position: "fixed",
        bottom: "20px",
        [position]: "20px",
        zIndex: 999,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: dark ? "#13ecc8" : "#0d1b19",
        color: dark ? "#0d1b19" : "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,.3)",
        fontSize: "20px",
      }}
    >
      <Icon name={dark ? "light_mode" : "dark_mode"} />
    </button>
  );
}
