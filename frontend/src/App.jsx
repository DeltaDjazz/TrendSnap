import { Routes, Route } from 'react-router-dom'
import { TrendsPage } from './pages/TrendsPage'
import { FavoritesPage } from './features/favorites/FavoritesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TrendsPage />} />
      <Route path="/favoris" element={<FavoritesPage />} />
    </Routes>
  )
}

export default App
