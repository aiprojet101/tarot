import { Toaster as SonnerToaster } from "sonner";

export function Sonner() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "glass-panel border-white/10",
          title: "text-foreground",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
