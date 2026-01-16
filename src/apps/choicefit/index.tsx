import { useState, useEffect } from 'react'

function ChoiceFit() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch('/api/choicefit/ping')
            .then(res => res.json())
            .then(data => {
                setMessage(data.message)
                setStatus('success')
            })
            .catch(err => {
                setMessage('Failed to connect to backend: ' + err.message)
                setStatus('error')
            })
    }, [])

    return (
        <div className="module-page">
            <h1>Choice-Fit</h1>
            <p>Fitness &amp; Coaching Platform</p>
            <div className={`status ${status}`}>
                {status === 'loading' && <p>Connecting to backend...</p>}
                {status === 'success' && <p>✅ {message}</p>}
                {status === 'error' && <p>❌ {message}</p>}
            </div>
        </div>
    )
}

export default ChoiceFit
