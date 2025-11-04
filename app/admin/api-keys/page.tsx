'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Save, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function APIKeysPage() {
  const [geminiKey, setGeminiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [currentKey, setCurrentKey] = useState('')

  useEffect(() => {
    fetchCurrentKey()
  }, [])

  const fetchCurrentKey = async () => {
    try {
      const res = await fetch('/api/admin/api-keys')
      const data = await res.json()
      if (data.success) {
        setCurrentKey(data.geminiKey || '')
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const handleSave = async () => {
    if (!geminiKey.trim()) {
      toast.error('Please enter a Gemini API key')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('API key updated successfully!')
        setCurrentKey(geminiKey)
        setGeminiKey('')
      } else {
        toast.error(data.message || 'Failed to update API key')
      }
    } catch (error) {
      toast.error('Failed to update API key')
    } finally {
      setSaving(false)
    }
  }

  const testGeminiKey = async () => {
    const keyToTest = geminiKey || currentKey
    
    if (!keyToTest) {
      toast.error('Please enter an API key first')
      return
    }

    setTesting(true)
    try {
      const res = await fetch('/api/admin/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: keyToTest })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('✅ API key is valid and working!')
      } else {
        toast.error(data.message || '❌ API key test failed')
      }
    } catch (error) {
      toast.error('❌ Failed to test API key')
    } finally {
      setTesting(false)
    }
  }

  const maskKey = (key: string) => {
    if (!key) return 'Not configured'
    if (key.length <= 8) return '••••••••'
    return `${key.slice(0, 4)}${'•'.repeat(20)}${key.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="w-8 h-8 text-primary" />
          API Key Management
        </h1>
        <p className="text-gray-500 mt-1">Manage your AI API keys for the platform</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Current Configuration
          </CardTitle>
          <CardDescription>Currently active API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Google Gemini API Key</div>
                <div className="text-xs text-gray-500 font-mono">
                  {currentKey ? maskKey(currentKey) : 'Not configured'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testGeminiKey}
                  disabled={!currentKey || testing}
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {currentKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>Active:</strong> AI features are enabled with the current key.
              </div>
            </div>
          )}

          {!currentKey && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Warning:</strong> No API key configured. AI features will not work.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Update Gemini API Key</CardTitle>
          <CardDescription>
            Update your Google Gemini API key when you hit rate limits or want to switch accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gemini-key">New Gemini API Key</Label>
            <div className="relative mt-1">
              <Input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Why update the API key?
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ <strong>Rate Limits:</strong> Switch keys when you hit daily limits</li>
              <li>✓ <strong>Multiple Accounts:</strong> Use different Google accounts</li>
              <li>✓ <strong>Testing:</strong> Test with different API keys</li>
              <li>✓ <strong>No Restart:</strong> Changes take effect immediately</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!geminiKey || saving}
              className="flex-1"
              size="lg"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save & Activate
                </>
              )}
            </Button>
            <Button
              onClick={testGeminiKey}
              disabled={!geminiKey || testing}
              variant="outline"
              size="lg"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Test First
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How to Get API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>📚 How to Get Google Gemini API Key</CardTitle>
          <CardDescription>Step-by-step guide to obtain your API key</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <div>
                <strong>Visit Google AI Studio:</strong>{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://makersuite.google.com/app/apikey
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <strong>Sign in</strong> with your Google account
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <strong>Click &quot;Create API Key&quot;</strong> button
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <div>
                <strong>Copy the API key</strong> and paste it above
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                5
              </span>
              <div>
                <strong>Click &quot;Test First&quot;</strong> to verify the key works
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                6
              </span>
              <div>
                <strong>Click &quot;Save & Activate&quot;</strong> to use the new key
              </div>
            </li>
          </ol>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              💡 <strong>Tip:</strong> Keep multiple API keys from different Google accounts. When one hits the rate limit, 
              simply switch to another key here without restarting the server!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
