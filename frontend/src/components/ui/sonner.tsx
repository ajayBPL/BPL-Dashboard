"use client";

import { useTheme } from "../../contexts/ThemeContext";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme === "custom" ? "light" : theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#fef3c7",
          "--normal-text": "#92400e",
          "--normal-border": "#f59e0b",
          "--success-bg": "#fef3c7",
          "--success-text": "#92400e",
          "--success-border": "#f59e0b",
          "--error-bg": "#fef2f2",
          "--error-text": "#dc2626",
          "--error-border": "#fca5a5",
          "--warning-bg": "#fef3c7",
          "--warning-text": "#92400e",
          "--warning-border": "#f59e0b",
        } as React.CSSProperties
      }
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          zIndex: 9999, // Ensure toasts appear above dialogs
        },
      }}
      {...props}
    />
  );
};

export { Toaster };