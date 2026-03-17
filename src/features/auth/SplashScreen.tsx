import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '../../routes/paths'

const SplashScreen = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const ctx = new AudioContext()

    // Djupt dramatiskt ljud - som att nå bergstoppen
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const delayNode = ctx.createDelay(2)
    const delayGain = ctx.createGain()

    // Eko-effekt
    delayNode.delayTime.value = 0.4
    delayGain.gain.value = 0.35

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)
    gainNode.connect(delayNode)
    delayNode.connect(delayGain)
    delayGain.connect(ctx.destination)

    // Djup bas-ton som stiger
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(55, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 2.5)

    // Övertoner
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(110, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 2.5)

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5)
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime + 1.5)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4)

    osc1.start(ctx.currentTime)
    osc2.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 4)
    osc2.stop(ctx.currentTime + 4)

    const timer = setTimeout(() => {
      navigate(routes.dashboard, { replace: true })
    }, 4000)

    return () => {
      clearTimeout(timer)
      ctx.close()
    }
  }, [navigate])

  return (
    <div className="splash-screen">
      <div className="splash-logo-wrap">
        <img className="splash-logo" src="/vertex-symbol.png" alt="Vertex Dominium" />

        <div className="splash-glow" />
      </div>
      <p className="splash-tagline">STRATEGY. JUDGEMENT. LEGACY.</p>
    </div>
  )
}

export default SplashScreen
