import React, { useState, useRef } from 'react'

export default function App() {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('en-US')
  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [error, setError] = useState(null)
  const contentRef = useRef()

  const startRecording = () => {
    setError(null)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return setError('Voice recognition not supported in this browser.')
    const rec = new SpeechRecognition()
    rec.lang = language
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInput(prev => (prev ? prev + ' ' + text : text))
    }
    rec.onerror = (e) => setError('Recording error: ' + e.error)
    rec.start()
  }

  const handleGenerate = async () => {
    setError(null)
    setLoading(true)
    setItinerary(null)
    setPdfUrl(null)
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, lang: language })
      })
      if (!resp.ok) throw new Error(await resp.text())
      const data = await resp.json()
      setItinerary(data.itinerary)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdfAndUpload = async () => {
    if (!itinerary) return setError('Generate an itinerary first.')
    setLoading(true)
    setError(null)
    try {
      const [{ default: html2canvas }] = await Promise.all([import('html2canvas')])
      const { default: jsPDF } = await import('jspdf')
      const element = contentRef.current
      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const blob = pdf.output('blob')

      const form = new FormData()
      form.append('file', blob, 'itinerary.pdf')
      const uploadResp = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-pdf`, { method: 'POST', body: form })
      if (!uploadResp.ok) throw new Error(await uploadResp.text())
      const { url } = await uploadResp.json()
      setPdfUrl(url)
    } catch (e) {
      setError('PDF export failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleShareWhatsApp = () => {
    if (!pdfUrl) return setError('Create PDF and upload to get a shareable link first.')
    const message = encodeURIComponent(`Check out my trip from MeraTripAi: ${pdfUrl}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <div style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif', padding: 20, maxWidth: 900, margin: 'auto'}}>
      <h1>MeraTripAi — Your AI travel planner</h1>
      <p>Describe your trip in natural language (or use voice). Supports Hindi (hi-IN).</p>

      <div style={{marginBottom: 8}}>
        <select value={language} onChange={e => setLanguage(e.target.value)} >
          <option value="en-US">English (en-US)</option>
          <option value="hi-IN">Hindi (hi-IN)</option>
          <option value="fr-FR">French (fr-FR)</option>
        </select>
        <button onClick={startRecording} style={{marginLeft: 8}}>Record Voice</button>
      </div>

      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="e.g., 7 days in Kerala with family, child-friendly, moderate budget, include backwaters" style={{width: '100%', height: 120}} />

      <div style={{marginTop: 10}}>
        <button onClick={handleGenerate} disabled={loading}>Generate Itinerary</button>
        <button onClick={handleExportPdfAndUpload} disabled={loading || !itinerary} style={{marginLeft: 8}}>Export PDF & Upload</button>
        <button onClick={handleShareWhatsApp} disabled={!pdfUrl} style={{marginLeft: 8}}>Share on WhatsApp</button>
      </div>

      {error && <div style={{color: 'crimson', marginTop: 10}}>{error}</div>}
      {loading && <div style={{color: 'gray', marginTop: 10}}>Working…</div>}

      {itinerary && (
        <div ref={contentRef} style={{border: '1px solid #eee', padding: 16, marginTop: 16, borderRadius: 8}}>
          <h2>{itinerary.title || 'Your Itinerary'}</h2>
          <p>{itinerary.summary}</p>
          {itinerary.days && itinerary.days.map((d, i) => (
            <div key={i}>
              <h3>Day {i+1}: {d.title}</h3>
              <ul>
                {d.items && d.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {pdfUrl && (
        <div style={{marginTop: 12}}>
          <div>Shareable PDF Link:</div>
          <a href={pdfUrl} target="_blank" rel="noreferrer">{pdfUrl}</a>
        </div>
      )}
    </div>
  )
}
