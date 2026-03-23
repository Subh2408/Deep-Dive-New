import { useRef } from 'react'
import { useStore } from './store'
import { useForest } from './hooks/useForest'
import Intro from './components/screens/Intro'
import Clearing from './components/screens/Clearing'
import Fork from './components/screens/Fork'
import Send from './components/screens/Send'
import Convergence from './components/screens/Convergence'
import Explorer from './components/screens/Explorer'
import DepthDots from './components/ui/DepthDots'

export default function App() {
  const screen = useStore(s => s.screen)
  const canvasRef = useRef(null)
  const { leanTrees } = useForest(canvasRef)

  return (
    <>
      <canvas ref={canvasRef} id="forest" />
      <div id="ui">
        {screen === 'intro'       && <Intro />}
        {screen === 'clearing'    && <Clearing />}
        {screen === 'fork'        && <Fork leanTrees={leanTrees} />}
        {screen === 'send'        && <Send />}
        {screen === 'convergence' && <Convergence />}
        {screen === 'explorer'    && <Explorer />}
      </div>
      <DepthDots />
    </>
  )
}
