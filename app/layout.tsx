import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ExamMaster Pro - Competitive Exam Preparation',
  description: 'Prepare for competitive exams with AI-powered test series, analytics, and gamification',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ExamMaster Pro',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#4F46E5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
