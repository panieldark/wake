'use client'

import { useState } from 'react'

interface StorytellingProps {
  onComplete: () => void
}

const prompts = [
  "A mysterious package arrives at your door with no return address",
  "You wake up with the ability to hear everyone's thoughts",
  "The last bookstore on Earth is about to close forever",
  "Your reflection in the mirror starts moving independently",
  "Time stops for everyone except you for exactly one hour"
]

export default function Storytelling({ onComplete }: StorytellingProps) {
  const [prompt] = useState(prompts[Math.floor(Math.random() * prompts.length)])
  const [story, setStory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = () => {
    if (story.trim().length > 50) {
      setSubmitted(true)
      setTimeout(onComplete, 2000)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto px-8 py-16 space-y-8">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-light">Creative Sprint</h3>
        <p className="text-gray-600">Continue this story in 2-3 sentences:</p>
      </div>
      
      {!submitted ? (
        <>
          <div className="text-lg italic text-gray-700 px-4 py-3 bg-gray-50 rounded-md">
            "{prompt}..."
          </div>
          
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
            placeholder="Continue the story..."
            autoFocus
          />
          
          <button
            onClick={handleSubmit}
            disabled={story.trim().length < 50}
            className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </>
      ) : (
        <div className="text-center space-y-4 animate-fade-in">
          <p className="text-xl">Great creativity!</p>
          <p className="text-gray-600">Your mind is warmed up and ready.</p>
        </div>
      )}
    </div>
  )
}