import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router' // Import the provider
import router from './routes/router'                // Import the router config you made
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Provide the router to your entire application */}
    <RouterProvider router={router} />
  </StrictMode>,
)