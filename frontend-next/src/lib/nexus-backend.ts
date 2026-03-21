const NEXUS_BACKEND_URL = process.env.NEXUS_BACKEND_URL
const NEXUS_API_KEY = process.env.NEXUS_API_KEY

async function fetchFromBackend<T>(path: string): Promise<T> {
  const res = await fetch(`${NEXUS_BACKEND_URL}${path}`, {
    headers: { 'X-API-Key': NEXUS_API_KEY ?? '' },
    next: { revalidate: 300 }, // ISR 5 minutes
  })
  if (!res.ok) throw new Error(`nexus-backend error: ${res.status}`)
  return res.json()
}

export interface CareerCoachData {
  targetDate: string
  phase: string
  domains: { name: string; progress: number }[]
  overdueTodos: string[]
  streak: number
}

export async function getCareerCoachData(): Promise<CareerCoachData> {
  return fetchFromBackend<CareerCoachData>('/api/v1/life/career-coach')
}
