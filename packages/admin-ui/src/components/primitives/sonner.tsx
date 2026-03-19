import * as React from "react"
import { useTheme } from "components/ThemeProvider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="tw:toaster tw:group"
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="tw:size-4" />
        ),
        info: (
          <InfoIcon className="tw:size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="tw:size-4" />
        ),
        error: (
          <OctagonXIcon className="tw:size-4" />
        ),
        loading: (
          <Loader2Icon className="tw:size-4 tw:animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--success)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--border)",
          "--warning-bg": "var(--popover)",
          "--warning-text": "var(--caution)",
          "--warning-border": "var(--border)",
          "--info-bg": "var(--popover)",
          "--info-text": "var(--primary)",
          "--info-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
