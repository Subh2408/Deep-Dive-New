import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import { generateConvergenceQuestion, generateShareMessage } from '../../hooks/useAI'

export default function Convergence() {
  const theme = useStore(s => s.theme)
  const answers = useStore(s => s.answers)
  const sharedQuestion = useStore(s => s.sharedQuestion)
  const setSharedQuestion = useStore(s => s.setSharedQuestion)
  const restart = useStore(s => s.restart)
  const setScreen = useStore(s => s.setScreen)

  const [displayedQ, setDisplayedQ] = useState('')
  const [qVisible, setQVisible] = useState(false)
  const [shareVisible, setShareVisible] = useState(false)
  const [nameVisible, setNameVisible] = useState(false)
  const [copyLabel, setCopyLabel] = useState('copy question')
  const [cachedMsg, setCachedMsg] = useState('')
  const nameRef = useRef(localStorage.getItem('dd_name') || '')

  useEffect(() => {
    async function load() {
      try {
        const q = await generateConvergenceQuestion(theme, answers)
        setSharedQuestion(q)
        setQVisible(true)
        // Word by word
        const ws = q.split(' ')
        let i = 0
        const iv = setInterval(() => {
          i++
          setDisplayedQ(ws.slice(0, i).join(' '))
          if (i >= ws.length) {
            clearInterval(iv)
            setTimeout(() => {
              setShareVisible(true)
              if (!localStorage.getItem('dd_name')) {
                setTimeout(() => setNameVisible(true), 600)
              }
            }, ws.length * 90 + 800)
          }
        }, 90)
        return () => clearInterval(iv)
      } catch {
        const fallback = "What would you do differently if you knew someone was watching — and does that answer tell you something?"
        setSharedQuestion(fallback)
        setDisplayedQ(fallback)
        setQVisible(true)
        setTimeout(() => setShareVisible(true), 1200)
      }
    }
    load()
  }, [])

  async function buildMsg() {
    if (cachedMsg) return cachedMsg
    const msg = await generateShareMessage(theme, answers, sharedQuestion, nameRef.current)
    setCachedMsg(msg)
    return msg
  }

  async function doShare(type) {
    const btn = type === 'copy' ? 'btnCopy' : 'btnWA'
    const msg = await buildMsg()
    if (type === 'copy') {
      try { await navigator.clipboard.writeText(msg) } catch {
        const ta = document.createElement('textarea')
        ta.value = msg; document.body.appendChild(ta); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      }
      setCopyLabel('copied')
      setTimeout(() => setCopyLabel('copy question'), 2200)
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
    }
  }

  function saveName(v) {
    nameRef.current = v.trim()
    localStorage.setItem('dd_name', v.trim())
    setCachedMsg('') // invalidate cache so new name is used
  }

  return (
    <div className="screen-convergence">
      <div className="conv-label">where the path ends</div>

      <div className="trails-wrap">
        <div className="trail">
          <div className="trail-name">your path</div>
          <div className="trail-dots">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`t-dot${a.leaf ? ' leaf' : ''}`}
                style={{ opacity: 0, animation: `fadeIn 0.4s ease ${0.1 + i * 0.14}s forwards` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`conv-q${qVisible ? ' visible' : ''}`}>{displayedQ}</div>

      <div className="conv-footer">the conversation doesn't end when you close the app</div>

      <div className="conv-actions">
        <button className="ghost-btn primary" onClick={() => setScreen('explorer')}>explore your path</button>
        <button className="ghost-btn" onClick={restart}>walk another path</button>
      </div>

      <div className={`share-row${shareVisible ? ' visible' : ''}`}>
        <button className="share-btn" onClick={() => doShare('copy')}>{copyLabel}</button>
        <button className="share-btn" onClick={() => doShare('whatsapp')}>send on whatsapp</button>
      </div>

      {nameVisible && (
        <div className="name-prompt visible">
          <label htmlFor="nameInput">sign it —</label>
          <input
            id="nameInput"
            className="name-input"
            type="text"
            placeholder="your name"
            maxLength={32}
            defaultValue={nameRef.current}
            onChange={e => saveName(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
