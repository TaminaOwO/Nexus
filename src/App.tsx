import { Suspense, lazy } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { IconLifeOS, IconKite, IconChoiceFit, IconDashboard } from './components/HandDrawnIcons'

// Lazy load module apps
const LifeOS = lazy(() => import('./apps/lifeos'))
const Kite = lazy(() => import('./apps/kite'))
const ChoiceFit = lazy(() => import('./apps/choicefit'))

function App() {
    const location = useLocation();

    return (
        <div className="app">
            <nav className="nav">
                <Link to="/" className={`nav-brand ${location.pathname === '/' ? 'active' : ''}`}>
                    <IconDashboard /> Nexus
                </Link>
                <div className="nav-links">
                    <Link to="/" className="mobile-only">
                        <IconDashboard />
                        <span>Home</span>
                    </Link>
                    <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
                        <IconLifeOS />
                        <span>LifeOS</span>
                    </Link>
                    <Link to="/kite" className={location.pathname.startsWith('/kite') ? 'active' : ''}>
                        <IconKite />
                        <span>Kite</span>
                    </Link>
                    <Link to="/choice-fit" className={location.pathname.startsWith('/choice-fit') ? 'active' : ''}>
                        <IconChoiceFit />
                        <span>Choice</span>
                    </Link>
                </div>
            </nav>

            <main className="main">
                <Suspense fallback={<div className="loading"><IconKite /> Loading module...</div>}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/admin/*" element={<LifeOS />} />
                        <Route path="/kite/*" element={<Kite />} />
                        <Route path="/choice-fit/*" element={<ChoiceFit />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    )
}

function Home() {
    return (
        <div className="home">
            <h1>Nexus</h1>
            <p>Modular Monolith Platform</p>
            <div className="modules">
                <Link to="/admin" className="module-card">
                    <span className="module-icon"><IconLifeOS /></span>
                    <div>
                        <h2>LifeOS</h2>
                        <p>Internal Admin Dashboard</p>
                    </div>
                </Link>
                <Link to="/kite" className="module-card">
                    <span className="module-icon"><IconKite /></span>
                    <div>
                        <h2>Kite Stock</h2>
                        <p>Stock Strategy Visualization</p>
                    </div>
                </Link>
                <Link to="/choice-fit" className="module-card">
                    <span className="module-icon"><IconChoiceFit /></span>
                    <div>
                        <h2>Choice-Fit</h2>
                        <p>Fitness & Coaching Platform</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default App
