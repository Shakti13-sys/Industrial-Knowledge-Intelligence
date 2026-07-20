'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  reasoning_steps?: string[]
  confidence?: number
  needs_verification?: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [relatedEntities, setRelatedEntities] = useState<any[]>([])
  const [showEntities, setShowEntities] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (response.data.related_entities && response.data.related_entities.length > 0) {
        setRelatedEntities(response.data.related_entities)
        setShowEntities(true)
      }
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleIngest = async () => {
    setIngesting(true)
    try {
      await axios.post(`${API_BASE_URL}/ingest`)
      alert('Documents ingested successfully!')
    } catch (error) {
      console.error('Ingest error:', error)
      alert('Failed to ingest documents')
    } finally {
      setIngesting(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/query`, {
        question: input,
      })
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
        reasoning_steps: response.data.reasoning_steps,
        confidence: response.data.confidence,
        needs_verification: response.data.needs_verification
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Query error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your question.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">IKIP</h1>
          <p className="text-xl opacity-90">Industrial Knowledge Intelligence Platform</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {showEntities && relatedEntities.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-amber-500 text-2xl">⚠️</div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">Proactive Recall: Related Entities Found!</h3>
                  <p className="text-amber-700">We found entities in your new document that match existing records.</p>
                </div>
              </div>
              <button
                onClick={() => setShowEntities(false)}
                className="text-amber-600 hover:text-amber-800 font-medium"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {relatedEntities.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200">
                  <p className="font-semibold text-gray-800">{item.entity}</p>
                  <p className="text-sm text-gray-600">Previously found in: {item.found_in.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Document Management</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-primary hover:bg-blue-800 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors inline-block"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </label>
            </div>
            <button
              onClick={handleIngest}
              disabled={ingesting}
              className="bg-secondary hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {ingesting ? 'Ingesting...' : 'Ingest Documents'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[600px] overflow-y-auto p-6 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-xl">Welcome to IKIP! Upload and ingest documents, then ask questions.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-6 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white shadow border rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'assistant' && msg.confidence !== undefined && (
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(msg.confidence)}`}>
                          Confidence: {msg.confidence}%
                        </span>
                        {msg.needs_verification && (
                          <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            ⚠️ Human Verification Recommended
                          </span>
                        )}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.role === 'assistant' && msg.reasoning_steps && msg.reasoning_steps.length > 0 && (
                      <ReasoningTrace steps={msg.reasoning_steps} />
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t opacity-80">
                        <p className="text-sm font-semibold">Sources:</p>
                        <ul className="text-sm mt-1">
                          {msg.sources.map((source, i) => (
                            <li key={i}>{source}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-left">
                <div className="inline-block p-4 rounded-lg bg-white shadow border rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about your industrial documents..."
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-primary hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ReasoningTrace({ steps }: { steps: string[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        How I found this
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            {steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
