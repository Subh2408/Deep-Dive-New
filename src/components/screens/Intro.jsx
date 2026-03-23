import { useStore } from '../../store'

export default function Intro() {
  const setScreen = useStore(s => s.setScreen)
  return (
    <div className="screen-intro">
      <div className="intro-eyebrow">a philosophical icebreaker</div>
      <div className="intro-title">Deep Dive</div>
      <div className="intro-line" />
      <div className="intro-sub">
        Pick a theme. Walk a path.<br />
        See what the forest brings back.
      </div>
      <button className="begin-btn" onClick={() => setScreen('clearing')}>
        enter the forest
      </button>
    </div>
  )
}
