import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, PlayCircle, BookOpen, Users } from "lucide-react"
import { PaymentButton } from "@/components/payment/PaymentButton"

export const metadata: Metadata = {
  title: "Video Courses | ExamMaster Competitive",
  description: "Browse our comprehensive video courses for competitive exams"
}

async function getCourses() {
  return await prisma.course.findMany({
    where: {
      isPublished: true
    },
    include: {
      _count: {
        select: {
          lectures: true,
          enrollments: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

function CourseCard({ course }: { course: any }) {
  const isFree = course.price === 0
  
  return (
    <Card className="flex flex-col h-full">
      {/* Thumbnail */}
      {course.thumbnail && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
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
            <PlayCircle className="h-4 w-4" />
            <span>{course._count.lectures} lectures</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{course.duration || 'Self-paced'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{course.level || 'All Levels'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course._count.enrollments} enrolled</span>
          </div>
        </div>

        {course.features && course.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {course.features.slice(0, 3).map((feature: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        {isFree ? (
          <Button asChild className="w-full">
            <Link href={`/courses/${course.slug}`}>
              Start Learning
            </Link>
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">₹{course.price.toLocaleString("en-IN")}</span>
              {course.discountPrice && course.discountPrice < course.price && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{course.discountPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <PaymentButton
              itemType="COURSE"
              itemId={course.id}
              itemTitle={course.title}
              amount={course.price}
              buttonText="Enroll Now"
              fullWidth
            />
          </div>
        )}
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
        <h1 className="text-4xl font-bold mb-2">Video Courses</h1>
        <p className="text-muted-foreground text-lg">
          Learn from expert instructors with our comprehensive video courses
        </p>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Courses Available</h2>
          <p className="text-muted-foreground">
            Check back soon! We're working on adding new courses.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
