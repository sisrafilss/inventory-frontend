"use client"

import { useTheme } from "@/lib/context/theme-context"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#c6d8ea] group-[.toaster]:text-neutral-900 group-[.toaster]:border-2 group-[.toaster]:border-[#800000] group-[.toaster]:rounded-none group-[.toaster]:shadow-2xl font-mono text-sm dark:group-[.toaster]:bg-slate-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-rose-900",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-emerald-600 group-[.toast]:text-white group-[.toast]:rounded-none",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-none",
          success: "group-[.toaster]:border-emerald-700 group-[.toaster]:bg-[#e0f2e9] dark:group-[.toaster]:bg-emerald-950 dark:group-[.toaster]:border-emerald-600",
          error: "group-[.toaster]:border-[#800000] group-[.toaster]:bg-[#fadbd8] dark:group-[.toaster]:bg-rose-950 dark:group-[.toaster]:border-rose-800",
          info: "group-[.toaster]:border-blue-700 group-[.toaster]:bg-[#d6eaf8] dark:group-[.toaster]:bg-blue-950 dark:group-[.toaster]:border-blue-800",
          warning: "group-[.toaster]:border-amber-600 group-[.toaster]:bg-[#fcf3cf] dark:group-[.toaster]:bg-amber-950 dark:group-[.toaster]:border-amber-700"
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
