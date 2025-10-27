"use client";

import { useTheme } from "../../contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme === "custom" ? "light" : (theme as any)}
      className="toaster group"
      position="top-right"
      expand={true}
      visibleToasts={5}
      offset={16}
      gap={12}
      duration={8000}
      closeButton
      richColors
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: 'group toast-item',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-90',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
        style: {
          background: 'var(--normal-bg)',
          border: '1px solid var(--normal-border)',
          color: 'var(--normal-text)',
        },
      }}
      style={
        {
          "--normal-bg": "#fef3c7",
          "--normal-text": "#92400e",
          "--normal-border": "#f59e0b",
          "--success-bg": "#dcfce7",
          "--success-text": "#166534",
          "--success-border": "#86efac",
          "--error-bg": "#fef2f2",
          "--error-text": "#dc2626",
          "--error-border": "#fca5a5",
          "--warning-bg": "#fef3c7",
          "--warning-text": "#92400e",
          "--warning-border": "#f59e0b",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };