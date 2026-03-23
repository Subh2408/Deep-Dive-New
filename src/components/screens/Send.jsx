import { useState } from 'react'
import { useStore } from '../../store'

export default function Send() {
  const answers = useStore(s => s.answers)
  const setScreen = useStore(s => s.setScreen)
  const [releasing, setReleasing] = useState(false)
  const lastQ = answers[answers.length - 1]

  function performSend() {
    if (releasing) return
    setReleasing(true)
    setTimeout(() => setScreen('convergence'), 2100)
  }

  return (
    <div className="screen-send">
      <div className="send-depth">the very end</div>
      <div className="send-q">"{lastQ?.q}"</div>
      <div className="send-label">let it go — it has somewhere to be</div>
      <div className={`send-orb${releasing ? ' releasing' : ''}`} onClick={performSend}>
        <div className="send-glyph">◎</div>
      </div>
    </div>
  )
}
