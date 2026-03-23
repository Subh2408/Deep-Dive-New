import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store'
import { anchors } from '../../data/anchors'
import { leafTexts } from '../../data/leafTexts'
import { generateQuestion, getDepthLabel } from '../../hooks/useAI'

export default function Fork({ leanTrees }) {
  const theme = useStore(s => s.theme)
  const qi = useStore(s => s.qi)
  const answers = useStore(s => s.answers)
  const leafUsed = useStore(s => s.leafUsed)
  const setScreen = useStore(s => s.setScreen)
  const recordAnswer = useStore(s => s.recordAnswer)
  const advanceQuestion = useStore(s => s.advanceQuestion)
  const walkForward = useStore(s => s.walkForward)
  const setAiLoading = useStore(s => s.setAiLoading)
  const setLeafUsed = useStore(s => s.setLeafUsed)

  const [currentQ, setCurrentQ] = useState(null)
  const [choicesVisible, setChoicesVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chosen, setChosen] = useState(null)
  const [leafOpen, setLeafOpen] = useState(false)
  const [leafFading, setLeafFading] = useState(false)
  const [leafFalling, setLeafFalling] = useState(false)
  const [words, setWords] = useState([])
  const [wordCount, setWordCount] = useState(0)

  const generating = useRef(false)
  const leafTimer = useRef(null)
  const leafDismiss = useRef(null)

  function clearTimers() {
    clearTimeout(leafTimer.current)
    clearTimeout(leafDismiss.current)
  }

  function startLeafTimer() {
    if (leafUsed || qi >= 6) return
    leafTimer.current = setTimeout(triggerLeaf, 4800 + qi * 800)
  }

  function triggerLeaf() {
    setLeafFalling(true)
    setTimeout(() => {
      setLeafFalling(false)
      setLeafOpen(true)
      leafDismiss.current = setTimeout(() => {
        setLeafFading(true)
        setTimeout(() => { setLeafOpen(false); setLeafFading(false) }, 750)
      }, 9000)
    }, 3350)
  }

  useEffect(() => {
    if (!theme) return
    setChosen(null)
    setChoicesVisible(false)
    setLeafOpen(false)
    setLeafFalling(false)
    clearTimers()

    async function loadQ() {
      if (qi < 5) {
        setCurrentQ(anchors[theme][qi])
        setTimeout(() => { setChoicesVisible(true); startLeafTimer() }, 980)
      } else {
        setLoading(true); generating.current = true; setAiLoading(true)
        try {
          const q = await generateQuestion(theme, answers, qi)
          setCurrentQ(q)
          setTimeout(() => { setChoicesVisible(true); startLeafTimer() }, 980)
        } catch {
          setCurrentQ({ q: "There is something underneath everything you've said. What is it?", l: "A fear I've learned to carry", r: "A longing I haven't quite named" })
          setTimeout(() => setChoicesVisible(true), 980)
        } finally {
          setLoading(false); generating.current = false; setAiLoading(false)
        }
      }
    }
    loadQ()
    return clearTimers
  }, [qi, theme])

  // Word reveal
  useEffect(() => {
    if (!currentQ) return
    const ws = currentQ.q.split(' ')
    setWords(ws); setWordCount(0)
    let i = 0
    const iv = setInterval(() => { i++; setWordCount(i); if (i >= ws.length) clearInterval(iv) }, 68)
    return () => clearInterval(iv)
  }, [currentQ])

  function choose(side) {
    if (generating.current || chosen) return
    clearTimers(); setLeafOpen(false); setChosen(side)
    const c = side === 'left' ? currentQ.l : currentQ.r
    recordAnswer({ q: currentQ.q, c, opts: { l: currentQ.l, r: currentQ.r } }, side)
    walkForward()
    setTimeout(() => { advanceQuestion(); if (qi + 1 >= 10) setScreen('send') }, 900)
  }

  function takeLeaf() {
    if (!leafOpen) return
    clearTimers(); setLeafOpen(false); setChosen('leaf')
    const lf = leafTexts[theme] || 'What if the question itself is the answer?'
    recordAnswer({ q: currentQ.q, c: lf, leaf: true, opts: { l: currentQ.l, r: currentQ.r } }, 'leaf')
    setLeafUsed(); walkForward()
    setTimeout(() => { advanceQuestion(); if (qi + 1 >= 10) setScreen('send') }, 900)
  }

  return (
    <div className="screen-fork">
      <div className="question-zone">
        <div className="question-depth">{getDepthLabel(qi)}</div>
        <div className="question-text">
          {words.map((w, i) => (
            <span key={i} style={{ opacity: i < wordCount ? 1 : 0, transition: `opacity 0.44s ease ${0.04 + i * 0.065}s` }}>
              {i > 0 ? ' ' : ''}{w}
            </span>
          ))}
        </div>
        {loading && (
          <div className="question-loading">
            <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
          </div>
        )}
      </div>

      <div className="paths-zone">
        <div className="paths-top">
          <div className="path-divider" />
          {['left', 'right'].map(side => (
            <div
              key={side}
              className={`path-choice${choicesVisible ? ' visible' : ''}${chosen === side ? ' chosen' : chosen ? ' unchosen' : ''}`}
              onClick={() => choose(side)}
              onMouseEnter={() => leanTrees?.(side === 'left' ? -1 : 1)}
              onMouseLeave={() => leanTrees?.(0)}
            >
              <div className="path-arrow">{side === 'left' ? '← left path' : 'right path →'}</div>
              <div className="path-text">{side === 'left' ? currentQ?.l : currentQ?.r}</div>
            </div>
          ))}
        </div>

        <div className={`leaf-zone${leafOpen ? ' open' : ''}${leafFading ? ' fading' : ''}`} onClick={takeLeaf}>
          <svg className="leaf-zone-icon" viewBox="0 0 30 38" fill="none">
            <path d="M15 2C23 5,29 13,27 23C25 29,19 35,15 37C11 35,5 29,3 23C1 13,7 5,15 2Z" fill="rgba(155,95,35,.62)" stroke="rgba(200,130,45,.38)" strokeWidth=".5"/>
            <path d="M15 3L15 35M15 17C15 17,21 21,25 19M15 13C15 13,9 17,5 15M15 23C15 23,20 26,23 24" stroke="rgba(200,130,45,.28)" strokeWidth=".5" fill="none"/>
          </svg>
          <div className="leaf-zone-content">
            <div className="leaf-zone-label">a leaf falls on you</div>
            <div className="leaf-zone-text">{leafTexts[theme]}</div>
            <div className="leaf-zone-hint">tap to walk this path instead</div>
          </div>
        </div>
      </div>

      {leafFalling && (
        <div id="leaf-fall" className="falling">
          <svg viewBox="0 0 30 38" fill="none" width="100%">
            <path d="M15 2C23 5,29 13,27 23C25 29,19 35,15 37C11 35,5 29,3 23C1 13,7 5,15 2Z" fill="rgba(155,95,35,.65)" stroke="rgba(200,130,45,.42)" strokeWidth=".5"/>
            <path d="M15 3L15 35M15 17C15 17,21 21,25 19M15 13C15 13,9 17,5 15M15 23C15 23,20 26,23 24" stroke="rgba(200,130,45,.3)" strokeWidth=".5" fill="none"/>
          </svg>
        </div>
      )}
    </div>
  )
}
