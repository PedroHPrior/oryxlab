import { createContext, useContext } from "react"

export interface Toast {
  id: number
  text: string
  kind: "info" | "success" | "error"
}

export interface ToastContextValue {
  push: (text: string, kind?: Toast["kind"]) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Resolves to the active ToastProvider's `push` function. Falls back to a
 * no-op when called outside any provider so the call site never has to
 * null-check.
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { push: () => {} }
}
