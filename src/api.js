// All AI calls go through our Express server — API key never hits the browser

export async function generate(messages, max_tokens = 1000) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function extractText(data) {
  return data.content?.map(c => c.text || '').join('').trim() || ''
}

export async function generateJSON(messages) {
  const data = await generate(messages)
  const raw = extractText(data).replace(/```json|```/g, '').trim()
  return JSON.parse(raw)
}
