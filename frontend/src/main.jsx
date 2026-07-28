import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { FavoritesProvider } from './features/favorites/FavoritesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FavoritesProvider>
      <BrowserRouter basename="/TrendSnap">
        <App />
      </BrowserRouter>
    </FavoritesProvider>
  </StrictMode>,
)
