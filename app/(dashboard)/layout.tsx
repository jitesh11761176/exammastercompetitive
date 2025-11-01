'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  FileText, 
  BarChart3, 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X,
  Shield,
  BookOpen
} from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  // Different navigation for admin vs regular users
  const navigation = isAdmin
    ? [
        // Admin-only navigation - management focused
        { name: 'Admin Dashboard', href: '/dashboard', icon: Home },
        { name: 'AI Assistant', href: '/admin/ai', icon: Shield },
        { name: 'Manage Tests', href: '/admin/tests', icon: FileText },
        { name: 'Manage Categories', href: '/admin/categories', icon: BookOpen },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      ]
    : [
        // Regular user navigation - exam focused
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'My Exams', href: '/exams', icon: BookOpen },
        { name: 'All Tests', href: '/tests', icon: FileText },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
        { name: 'Profile', href: '/profile', icon: User },
      ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-xl font-bold text-primary">ExamMaster</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || ''}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-sm text-gray-600">
                Level {Math.floor(Math.sqrt((session as any)?.user?.points || 0 / 100)) + 1}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
