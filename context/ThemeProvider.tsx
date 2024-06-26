"use client";
// we will create our own Provider i.e a custom provider
import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  mode: string;
  setMode: (mode: string) => void;
}

// creating the context object
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// our custom ro
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState("");

  const handleThemeChange = () => {
    // figuring out if our users OS prefers the dark mode
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setMode("dark");
      document.documentElement.classList.add("dark");
    } else {
      setMode("light");
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    handleThemeChange();
    console.log("handleThemeChange from useEffect in ThemeProvider");
  }, [mode]);

  // Providers almost always returns the context
  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// something to create when creating a custom context is the useTheme function for utilizing the context we created
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
