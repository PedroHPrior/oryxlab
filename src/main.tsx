import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from '@/lib/router'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { registerServiceWorker } from '@/app/sw'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary area="OryxLab">
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)

registerServiceWorker()
