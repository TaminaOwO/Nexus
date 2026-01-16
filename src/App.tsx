import { Suspense, lazy } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

// Lazy load module apps
const LifeOS = lazy(() => import('./apps/lifeos'))
const Kite = lazy(() => import('./apps/kite'))
const ChoiceFit = lazy(() => import('./apps/choicefit'))

function App() {
    return (
        <div className="app">
            <nav className="nav">
                <Link to="/admin">LifeOS</Link>
                <Link to="/kite">Kite Stock</Link>
                <Link to="/choice-fit">Choice-Fit</Link>
            </nav>

            <main className="main">
                <Suspense fallback={<div className="loading">Loading module...</div>}>
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
                <div className="module-card">
                    <h2>LifeOS</h2>
                    <p>Internal Admin Dashboard</p>
                </div>
                <div className="module-card">
                    <h2>Kite Stock</h2>
                    <p>Stock Strategy Visualization</p>
                </div>
                <div className="module-card">
                    <h2>Choice-Fit</h2>
                    <p>Fitness &amp; Coaching Platform</p>
                </div>
            </div>
        </div>
    )
}

export default App
