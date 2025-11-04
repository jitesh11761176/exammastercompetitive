import { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Courses | ExamMaster Competitive",
  description: "Browse our comprehensive courses for competitive exams"
}

async function getCourses() {
  return await prisma.course.findMany({
    where: {
      isActive: true
    },
    include: {
      _count: {
        select: {
          categories: true,
          enrollments: true
        }
      },
      categories: {
        where: {
          isActive: true
        },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      order: 'asc'
    }
  })
}

function CourseCard({ course }: { course: any }) {
  const isFree = course.isFree
  
  return (
    <Card className="flex flex-col h-full">
      {/* Thumbnail */}
      {course.thumbnail && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
          {isFree ? (
            <Badge variant="secondary">Free</Badge>
          ) : (
            <Badge>Premium</Badge>
          )}
        </div>
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{course._count.categories} categories</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course._count.enrollments} enrolled</span>
          </div>
        </div>

        {/* Show preview of categories */}
        {course.categories && course.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {course.categories.map((category: any) => (
              <Badge key={category.id} variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {course._count.categories > 3 && (
              <Badge variant="outline" className="text-xs">
                +{course._count.categories - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Show tags if available */}
        {course.tags && course.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.slice(0, 3).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <Button asChild className="w-full">
          <Link href={`/courses/${course.slug}`}>
            {isFree ? 'Start Learning' : 'View Course'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default async function CoursesPage() {
  const courses = await getCourses()

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Courses</h1>
        <p className="text-muted-foreground text-lg">
          Browse our comprehensive test courses for competitive exams
        </p>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Courses Available</h2>
          <p className="text-muted-foreground">
            Check back soon! We&apos;re working on adding new courses.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
