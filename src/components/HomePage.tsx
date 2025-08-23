'use client'

import { Button } from '@/components/ui/button'

interface HomePageProps {
  onStart: () => void
}

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 sm:px-8 lg:px-12">
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-3xl w-full space-y-12 animate-fade-in">
          <div className="text-center space-y-6">
            <h1 className="text-6xl sm:text-7xl font-light tracking-tighter">Wake</h1>
            <p className="text-xl sm:text-2xl text-gray-600 font-light max-w-2xl mx-auto">
              Five minutes to prime your mind, sharpen your focus, and activate your body.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 space-y-8">
            <div className="prose prose-gray max-w-none">
              <p className="text-lg leading-relaxed">
                Think of it as your cognitive ignition sequence—a brief, scientifically-informed 
                warmup that leaves you ready to perform at your peak.
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: '🧠', text: 'Memory activation' },
                { icon: '🎯', text: 'Executive function' },
                { icon: '👆', text: 'Motor precision' },
                { icon: '⌨️', text: 'Typing flow state' },
                { icon: '👁️', text: 'Visual attention' },
                { icon: '🔢', text: 'Mental arithmetic' },
                { icon: '🎯', text: 'Goal setting' },
                { icon: '🌊', text: 'Mindful breathing' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <Button onClick={onStart} size="lg" className="w-full sm:w-auto">
                Begin activation
              </Button>
            </div>
          </div>
          
          <footer className="text-center text-sm text-gray-500">
            Built on principles from neuroscience and atomic habits
          </footer>
        </div>
      </div>
    </div>
  )
}