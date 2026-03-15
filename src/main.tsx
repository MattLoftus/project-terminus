import './data/register-bases'; // populates registry — MUST be before any store usage
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ensureInitialized } from './store/simulation'
import App from './App.tsx'

// Initialize store with Moon state now that registry is populated
ensureInitialized();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
