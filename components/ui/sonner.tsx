"use client";

import { Toaster as SonnerToaster } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}

export { Toaster };
