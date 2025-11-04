'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, Database, Key, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'ExamMaster Competitive',
    siteDescription: 'Your ultimate exam preparation platform',
    contactEmail: 'support@exammastercompetitive.com',
    maxTestDuration: 180,
    negativeMarking: 0.25,
    passingPercentage: 33,
  })

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Settings saved successfully!')
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Configure your platform settings</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Test Settings
            </CardTitle>
            <CardDescription>Default test configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxTestDuration">Max Test Duration (minutes)</Label>
              <Input
                id="maxTestDuration"
                type="number"
                value={settings.maxTestDuration}
                onChange={(e) => setSettings({ ...settings, maxTestDuration: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="negativeMarking">Negative Marking (per wrong answer)</Label>
              <Input
                id="negativeMarking"
                type="number"
                step="0.25"
                value={settings.negativeMarking}
                onChange={(e) => setSettings({ ...settings, negativeMarking: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
              <Input
                id="passingPercentage"
                type="number"
                value={settings.passingPercentage}
                onChange={(e) => setSettings({ ...settings, passingPercentage: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>Sensitive configuration (view only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">Database URL</div>
              <div className="text-xs text-gray-500 font-mono">
                {process.env.DATABASE_URL ? '••••••••••••••••' : 'Not configured'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">Gemini API Key</div>
              <div className="text-xs text-gray-500 font-mono">
                {process.env.GEMINI_API_KEY ? '••••••••••••••••' : 'Not configured'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm font-medium text-gray-700 mb-1">NextAuth Secret</div>
              <div className="text-xs text-gray-500 font-mono">
                {process.env.NEXTAUTH_SECRET ? '••••••••••••••••' : 'Not configured'}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              💡 Environment variables are configured in .env.local (local) or Vercel dashboard (production)
            </p>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Settings
            </CardTitle>
            <CardDescription>Email service configuration (coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              📧 Email integration is planned for future updates. This will include:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Test result notifications</li>
                <li>Password reset emails</li>
                <li>Course enrollment confirmations</li>
                <li>Weekly progress reports</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
