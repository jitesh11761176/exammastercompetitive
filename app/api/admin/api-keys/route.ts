import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const CONFIG_FILE = join(process.cwd(), '.env.runtime')

function getEnvConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, 'utf-8')
      const config: Record<string, string> = {}
      content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim()
        }
      })
      return config
    }
  } catch (error) {
    console.error('Error reading config:', error)
  }
  return {}
}

function saveEnvConfig(config: Record<string, string>) {
  try {
    const content = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    writeFileSync(CONFIG_FILE, content, 'utf-8')
    
    // Update process.env immediately
    Object.entries(config).forEach(([key, value]) => {
      process.env[key] = value
    })
    
    return true
  } catch (error) {
    console.error('Error saving config:', error)
    return false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const config = getEnvConfig()
    const geminiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''

    return NextResponse.json({
      success: true,
      geminiKey: geminiKey ? `${geminiKey.slice(0, 4)}${'*'.repeat(20)}${geminiKey.slice(-4)}` : ''
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { geminiKey } = await request.json()

    if (!geminiKey || !geminiKey.startsWith('AIza')) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key format. Should start with "AIza"' },
        { status: 400 }
      )
    }

    const config = getEnvConfig()
    config.GEMINI_API_KEY = geminiKey

    const saved = saveEnvConfig(config)

    if (saved) {
      return NextResponse.json({
        success: true,
        message: 'API key updated successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to save API key' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error updating API keys:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update API keys' },
      { status: 500 }
    )
  }
}
