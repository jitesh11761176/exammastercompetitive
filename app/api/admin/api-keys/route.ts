import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: import { prisma } from "@/lib/prisma"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getGeminiKey() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { category: 'ai' }
    })
    return settings?.geminiApiKey || process.env.GEMINI_API_KEY || ''
  } catch (error) {
    console.error('Error reading Gemini key:', error)
    return process.env.GEMINI_API_KEY || ''
  }
}

async function saveGeminiKey(apiKey: string) {
  try {
    await prisma.platformSettings.upsert({
      where: { category: 'ai' },
      update: { 
        geminiApiKey: apiKey,
        settings: { lastUpdated: new Date().toISOString() }
      },
      create: { 
        category: 'ai',
        geminiApiKey: apiKey,
        settings: { lastUpdated: new Date().toISOString() }
      }
    })
    return true
  } catch (error) {
    console.error('Error saving Gemini key:', error)
    return false
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const geminiKey = await getGeminiKey()

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

    const saved = await saveGeminiKey(geminiKey)

    if (saved) {
      // Update process.env immediately for this instance
      process.env.GEMINI_API_KEY = geminiKey
      
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

