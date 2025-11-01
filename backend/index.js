const express = require('express')
const cors = require('cors')
const multer = require('multer')
const fetch = require('node-fetch')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const upload = multer()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase environment variables not set. /api/upload-pdf will fail until configured.')
}
const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '')

async function callOpenAI(prompt) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800
    })
  })
  if (!resp.ok) throw new Error('OpenAI error: ' + await resp.text())
  return resp.json()
}

function buildPrompt(text, lang) {
  return `You are a helpful travel assistant. User input: "${text}". Detect user language if necessary. Produce a JSON object ONLY with fields: title, summary (1-2 short paragraphs), days (array) where each day is { title: string, items: [strings] }. Include child-friendly and senior-friendly notes if requested. Return strictly valid JSON without extra commentary.`
}

app.post('/api/itinerary', async (req, res) => {
  try {
    const { text, lang } = req.body
    const prompt = buildPrompt(text, lang)
    const ai = await callOpenAI(prompt)
    const content = ai.choices?.[0]?.message?.content || ''
    let parsed = { title: 'Itinerary', summary: content, days: [] }
    try { parsed = JSON.parse(content) } catch (e) {
      const m = content.match(/\{[\s\S]*\}/)
      if (m) {
        try { parsed = JSON.parse(m[0]) } catch (e2) { /* ignore */ }
      }
    }
    res.json({ itinerary: parsed })
  } catch (e) {
    console.error(e)
    res.status(500).send(e.message)
  }
})

// Upload to Supabase Storage
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('file required')
    const buffer = req.file.buffer
    const filename = `itineraries/${Date.now()}-${Math.random().toString(36).slice(2,9)}.pdf`
    // bucket name from env
    const bucket = process.env.SUPABASE_BUCKET || 'public'
    const { data, error } = await supabase.storage.from(bucket).upload(filename, buffer, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    })
    if (error) throw error
    // create public URL
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}`
    res.json({ url })
  } catch (e) {
    console.error(e)
    res.status(500).send(e.message)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log('Backend listening on', PORT))
