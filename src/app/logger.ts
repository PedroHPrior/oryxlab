// Lightweight namespaced logger.
//
// Usage:
//   const log = createLogger("realmeye")
//   log.error("import failed", err)
//
// In dev, logs go to the browser console with timestamps and namespaces.
// In prod, errors are still logged so platform tools (Railway / Vercel) can
// capture them; debug/info are silenced to keep the console clean.

type Level = "debug" | "info" | "warn" | "error"

const IS_PROD = typeof import.meta !== "undefined" && import.meta.env?.PROD

function emit(level: Level, namespace: string, args: unknown[]) {
  if (IS_PROD && (level === "debug" || level === "info")) return
  const prefix = `[${namespace}]`
   
  const fn = console[level] ?? console.log
  fn(prefix, ...args)
}

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export function createLogger(namespace: string): Logger {
  return {
    debug: (...args) => emit("debug", namespace, args),
    info: (...args) => emit("info", namespace, args),
    warn: (...args) => emit("warn", namespace, args),
    error: (...args) => emit("error", namespace, args),
  }
}

export const log = createLogger("oryxlab")
