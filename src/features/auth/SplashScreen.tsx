import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '../../routes/paths'

const SplashScreen = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(routes.dashboard, { replace: true })
    }, 4000)

    return () => {
      clearTimeout(timer)
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