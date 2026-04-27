import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from '@/lib/router'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { ToastProvider } from '@/sections/_shared'
import { registerServiceWorker } from '@/app/sw'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary area="OryxLab">
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)

registerServiceWorker()
