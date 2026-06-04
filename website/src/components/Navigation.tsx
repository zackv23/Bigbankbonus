interface NavigationProps {
  currentPage: 'home' | 'banks' | 'about'
  onNavigate: (page: 'home' | 'banks' | 'about') => void
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <h1>BigBankBonus</h1>
        </div>
        <ul className="nav-menu">
          <li>
            <button
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${currentPage === 'banks' ? 'active' : ''}`}
              onClick={() => onNavigate('banks')}
            >
              Banks
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => onNavigate('about')}
            >
              About
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
