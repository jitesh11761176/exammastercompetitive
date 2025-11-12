import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: import { prisma } from '@/lib/prisma'
import { getRAGContext } from '@/lib/ai/rag-context'
import { generateChatResponse } from '@/lib/ai/openai-client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, message, questionId } = body

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Get or create chat session
    let chatSession
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Last 20 messages for context
          },
        },
      })
      // If a sessionId was provided but not found, create a new session
      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            userId: session.user.id,
            questionId: questionId || null,
            title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          },
          include: { messages: true },
        })
      }
    } else {
      // Create new chat session
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          questionId: questionId || null,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: true },
      })
    }

    // Get RAG context from solutions database
    const ragContext = await getRAGContext(message, questionId)

    // Build conversation history
    const conversationHistory = (chatSession?.messages ?? []).map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession!.id,
        role: 'USER',
        content: message,
      },
    })

    // Generate AI response
    const aiResponse = await generateChatResponse({
      message,
      conversationHistory,
      ragContext,
      questionId,
    })

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'ASSISTANT',
        content: aiResponse.content,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        ragSources: aiResponse.sources,
        confidence: aiResponse.confidence,
      },
    })

    // Update session context
    await prisma.chatSession.update({
      where: { id: chatSession!.id },
      data: { 
        context: ragContext.slice(0, 1000), // Store truncated context
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      sessionId: chatSession!.id,
      message: {
        id: aiMessage.id,
        content: aiMessage.content,
        sources: aiResponse.sources,
        confidence: aiResponse.confidence,
      },
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    )
  }
}

// Get chat history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Get specific session
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      return NextResponse.json(chatSession)
    } else {
      // Get all user sessions
      const sessions = await prisma.chatSession.findMany({
        where: { userId: session.user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Just the last message for preview
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })

      return NextResponse.json(sessions)
    }
  } catch (error: any) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
