import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      {/* Hero Section */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-primary">ExamMaster Pro</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Master Competitive Exams with
            <span className="text-primary"> AI-Powered</span> Preparation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Experience the future of exam preparation with personalized test series,
            real-time analytics, and gamified learning
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Learning Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ExamMaster Pro?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <CardTitle>AI-Powered Questions</CardTitle>
              <CardDescription>
                Generate unlimited practice questions using Google Gemini 2.0 Flash
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Track your progress with detailed performance insights and trends
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <CardTitle>Gamification</CardTitle>
              <CardDescription>
                Earn points, unlock badges, and compete on the leaderboard
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⏱️</span>
              </div>
              <CardTitle>Real-Time Testing</CardTitle>
              <CardDescription>
                Practice with exam-like timer and instant result evaluation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <CardTitle>Offline Support</CardTitle>
              <CardDescription>
                Practice anytime, anywhere with PWA and offline capabilities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <CardTitle>AI Doubt Solving</CardTitle>
              <CardDescription>
                Get instant clarification on any topic with AI tutor
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-secondary text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Excel in Your Exams?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of students already using ExamMaster Pro
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 ExamMaster Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
