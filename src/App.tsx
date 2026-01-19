import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSpring, animated } from '@react-spring/web'

const queryClient = new QueryClient()

function App() {
  const [count, setCount] = useState(0)

  const springs = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <animated.div
          style={springs}
          className="text-center p-8 bg-gray-800 rounded-lg shadow-2xl"
        >
          <h1 className="text-5xl font-bold mb-4 text-white">Tensho</h1>
          <p className="text-xl text-gray-300 mb-8">Mahjong Roguelike</p>
          <div className="card">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              count is {count}
            </button>
            <p className="mt-4 text-gray-400">
              Edit{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">src/App.tsx</code>{' '}
              and save to test HMR
            </p>
          </div>
        </animated.div>
      </div>
    </QueryClientProvider>
  )
}

export default App
