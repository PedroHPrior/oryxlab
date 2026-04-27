import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface Toast {
  id: number
  text: string
  kind: "info" | "success" | "error"
}

interface ToastContextValue {
  push: (text: string, kind?: Toast["kind"]) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { push: () => {} }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const push = useCallback((text: string, kind: Toast["kind"] = "info") => {
    idRef.current += 1
    const id = idRef.current
    setToasts((curr) => [...curr, { id, text, kind }])
    setTimeout(() => setToasts((curr) => curr.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(r)
  }, [])

  const palette =
    toast.kind === "success"
      ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300"
      : toast.kind === "error"
        ? "border-rose-400/60 bg-rose-400/10 text-rose-700 dark:text-rose-300"
        : "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-xl border bg-white px-4 py-2.5 text-sm shadow-2xl transition-all duration-200 dark:bg-zinc-900 ${palette} ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      {toast.text}
    </div>
  )
}
