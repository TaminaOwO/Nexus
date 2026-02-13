import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    email: string | null
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    email: null,
    logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                setIsAuthenticated(data.authenticated)
                setEmail(data.email || null)
            })
            .catch(() => {
                setIsAuthenticated(false)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [])

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        setIsAuthenticated(false)
        setEmail(null)
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, email, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
