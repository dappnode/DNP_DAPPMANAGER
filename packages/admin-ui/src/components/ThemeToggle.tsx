import React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "components/primitives/button";
import { useTheme } from "components/ThemeProvider";
import { cn } from "lib/utils";

/**
 * A small icon button that toggles between light and dark mode.
 *
 * Uses the app-wide ThemeProvider so the choice persists across reloads
 * and is consistent across all pages (new + legacy).
 *
 * The Sun/Moon icons crossfade using Tailwind's dark: variant — only the
 * relevant icon is visible at any given time.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("tw:relative", className)}
      aria-label="Toggle theme"
    >
      <Sun className="tw:size-4 tw:rotate-0 tw:scale-100 tw:transition-all tw:dark:scale-0 tw:dark:-rotate-90" />
      <Moon className="tw:absolute tw:size-4 tw:rotate-90 tw:scale-0 tw:transition-all tw:dark:scale-100 tw:dark:rotate-0" />
      <span className="tw:sr-only">Toggle theme</span>
    </Button>
  );
}
