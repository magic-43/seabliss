import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GET, HEAD } from '../src/app/api/health/route'

test('health endpoint returns 500 when Supabase env variables are missing', async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const response = await GET()
    assert.equal(response.status, 500)

    const data = await response.json()
    assert.equal(data.status, 'error')
    assert.match(data.message, /not configured/i)
  } finally {
    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  }
})

test('HEAD handler delegates cleanly to GET', async () => {
  const response = await HEAD()
  assert.ok(response)
  assert.ok(response.status === 200 || response.status === 500 || response.status === 502)
})
