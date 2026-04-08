import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  onDismiss: (id: string) => void;
}

export function ToastItem({ id, title, description, variant = "default", onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        "glass-panel p-4 pr-8 shadow-lg relative pointer-events-auto",
        variant === "destructive" && "border-destructive/50"
      )}
    >
      {title && <div className="font-semibold text-sm">{title}</div>}
      {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 rounded-sm opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
