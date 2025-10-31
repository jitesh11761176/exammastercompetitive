import { requireRole } from '@/lib/rbac'
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  Users, 
  Folder, 
  Settings,
  Shield,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  await requireRole(['ADMIN', 'CREATOR'])

  const modules = [
    {
      title: 'Question Bank',
      description: 'Manage questions, bulk import, and verification',
      icon: BookOpen,
      href: '/admin/questions',
      color: 'text-blue-600',
    },
    {
      title: 'Tests Management',
      description: 'Create, edit, and organize practice tests',
      icon: FileText,
      href: '/admin/tests',
      color: 'text-green-600',
    },
    {
      title: 'Analytics',
      description: 'View platform stats and user insights',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-purple-600',
    },
    {
      title: 'Users',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'text-orange-600',
    },
    {
      title: 'Content Library',
      description: 'Categories, subjects, topics, and syllabus',
      icon: Folder,
      href: '/admin/content',
      color: 'text-pink-600',
    },
    {
      title: 'Settings',
      description: 'Platform configuration and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600',
    },
  ]

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Console</h1>
        </div>
        <p className="text-muted-foreground">
          Manage all aspects of ExamMaster Pro platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className={`h-10 w-10 ${module.color}`} />
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-primary hover:underline">
                    Open module →
                  </span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
