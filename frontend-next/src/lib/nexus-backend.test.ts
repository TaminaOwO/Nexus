import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We test by importing the module fresh each time with mocked env + fetch
const MOCK_URL = 'http://localhost:9999'
const MOCK_KEY = 'test-api-key-123'

describe('nexus-backend Life fetchers', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    vi.stubEnv('NEXUS_BACKEND_URL', MOCK_URL)
    vi.stubEnv('NEXUS_API_KEY', MOCK_KEY)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function loadModule() {
    return await import('./nexus-backend')
  }

  // AC-1: HealthRecord interface fields
  it('getHealthLatest calls /api/v1/life/health/latest', async () => {
    const mockData = {
      body_fat_pct: 25.3,
      weight_kg: 55.0,
      sleep_hours: 7.5,
      resting_hr: 62,
      record_date: '2026-04-05',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const mod = await loadModule()
    const result = await mod.getHealthLatest()

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${MOCK_URL}/api/v1/life/health/latest`,
      expect.objectContaining({
        headers: { 'X-API-Key': MOCK_KEY },
      })
    )
  })

  // AC-1: SkincareRoutine interface
  it('getSkincareToday calls /api/v1/life/skincare/today', async () => {
    const mockData = {
      am: [
        { product: 'Cleanser', badges: ['gentle'], is_optional: false },
        { product: 'Sunscreen', is_optional: false },
      ],
      pm: [
        { product: 'Oil Cleanser', is_optional: false },
        { product: 'Moisturizer', badges: ['ceramide'], is_optional: true },
      ],
      banned: ['Retinol'],
      phase: 'Follicular',
      mode: 'normal',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const mod = await loadModule()
    const result = await mod.getSkincareToday()

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${MOCK_URL}/api/v1/life/skincare/today`,
      expect.objectContaining({
        headers: { 'X-API-Key': MOCK_KEY },
      })
    )
  })

  it('getSkincareCycle calls /api/v1/life/skincare/cycle', async () => {
    const mockData = { current_day: 14, phase: 'Ovulation' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const mod = await loadModule()
    const result = await mod.getSkincareCycle()

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${MOCK_URL}/api/v1/life/skincare/cycle`,
      expect.objectContaining({
        headers: { 'X-API-Key': MOCK_KEY },
      })
    )
  })

  // AC-4: X-API-Key header is always sent
  it('includes X-API-Key header in all requests', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const mod = await loadModule()
    await mod.getHealthLatest()

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[1].headers['X-API-Key']).toBe(MOCK_KEY)
  })
})
