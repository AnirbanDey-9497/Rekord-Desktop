import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import { Button } from "@/components/ui/button"

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="w-full min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="flex gap-8 mb-8">
          <a href="https://electron-vite.github.io" target="_blank">
            <img src={viteLogo} className="h-24 hover:drop-shadow-xl transition-all" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="h-24 hover:drop-shadow-xl transition-all" alt="React logo" />
          </a>
        </div>
        <h1 className="text-4xl font-bold mb-8">Vite + React</h1>
        <div className="flex flex-col items-center gap-4">
          <Button 
            variant="default"
            size="lg"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </Button>
          <p className="text-muted-foreground">
            Edit <code className="font-mono bg-muted px-1 py-0.5 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </main>
  )
}

export default App
