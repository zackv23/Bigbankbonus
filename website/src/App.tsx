import { useState } from 'react'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'banks' | 'about'>('home')

  return (
    <div className="app">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="content">
        {currentPage === 'home' && <Home />}
        {currentPage === 'banks' && (
          <div className="page">
            <h1>Bank Database</h1>
            <p>Coming soon: Searchable bank and credit card offers database</p>
          </div>
        )}
        {currentPage === 'about' && (
          <div className="page">
            <h1>About</h1>
            <p>Learn more about bank churning and credit card strategies</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
