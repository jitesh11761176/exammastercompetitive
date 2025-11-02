import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Users, IndianRupee, CheckCircle2 } from 'lucide-react'

interface TestSeriesCardProps {
  series: any
}

export default function TestSeriesCard({ series }: TestSeriesCardProps) {
  const displayPrice = series.discountPrice || series.price
  const hasDiscount = series.discountPrice && series.discountPrice < series.price

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <CardHeader className="relative">
        {series.thumbnail && (
          <div className="w-full h-40 mb-4 rounded-md overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
            <Image
              src={series.thumbnail}
              alt={series.title}
              width={400}
              height={160}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2">
              {series.exam.category.name}
            </Badge>
            <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
              {series.title}
            </CardTitle>
          </div>
          
          {series.isEnrolled && (
            <Badge variant="default" className="shrink-0 bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Enrolled
            </Badge>
          )}
        </div>

        <CardDescription className="line-clamp-2 mt-2">
          {series.description || `Complete test series for ${series.exam.name}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{series.totalTests} Tests</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{series.totalQuestions} Questions</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{series.enrolledCount.toLocaleString()} enrolled</span>
          </div>

          {series.isFree ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Free
            </Badge>
          ) : (
            <div className="flex items-baseline gap-2">
              <div className="flex items-center text-2xl font-bold text-primary">
                <IndianRupee className="w-5 h-5" />
                {displayPrice.toLocaleString()}
              </div>
              {hasDiscount && (
                <div className="flex items-center text-sm text-muted-foreground line-through">
                  <IndianRupee className="w-3 h-3" />
                  {series.price.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <Link href={`/test-series/${series.slug}?examId=${series.exam.id}`} className="w-full">
          <Button className="w-full" variant={series.isEnrolled ? "outline" : "default"}>
            {series.isEnrolled ? 'Continue Learning' : 'View Details'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
