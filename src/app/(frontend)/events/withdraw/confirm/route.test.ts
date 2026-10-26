import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  withdraw: vi.fn(async (_payload: unknown, _token: string | null) => 'withdrawn'),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', () => ({ getPayload: async () => ({}) }))
vi.mock('@/lib/events/withdraw', () => ({ withdraw: state.withdraw }))

const { POST } = await import('@/app/(frontend)/events/withdraw/confirm/route')
const { resetRateLimit } = await import('@/lib/rate-limit')

function post(token?: string, ip = '203.0.113.7'): Promise<Response> {
  const body = new FormData()
  if (token !== undefined) body.append('token', token)
  return POST(
    new Request('http://localhost/events/withdraw/confirm', {
      method: 'POST',
      body,
      headers: { 'cf-connecting-ip': ip },
    }),
  )
}

beforeEach(() => {
  resetRateLimit()
  state.withdraw.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => vi.restoreAllMocks())

describe('POST /events/withdraw/confirm', () => {
  it('withdraws with the posted token and sends the visitor back to the page', async () => {
    const response = await post('abc.def')
    expect(state.withdraw).toHaveBeenCalledWith(expect.anything(), 'abc.def')
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/events/withdraw?token=abc.def')
  })

  it('passes no token on when none, or an absurd one, was posted', async () => {
    await post()
    await post('x'.repeat(500))
    expect(state.withdraw.mock.calls.map((call) => call[1])).toEqual([null, null])
  })

  it('never logs the token', async () => {
    state.withdraw.mockResolvedValueOnce('invalid')
    await post('secret-looking.token')
    const logged = [...vi.mocked(console.warn).mock.calls, ...vi.mocked(console.error).mock.calls]
      .flat()
      .join(' ')
    expect(logged).not.toContain('secret-looking')
  })

  it('rate-limits one address', async () => {
    for (let i = 0; i < 5; i += 1) await post('abc.def', '198.51.100.1')
    expect((await post('abc.def', '198.51.100.1')).status).toBe(429)
  })

  it('answers a failure generically', async () => {
    state.withdraw.mockRejectedValueOnce(new Error('database down'))
    const response = await post('abc.def')
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('database')
  })
})
