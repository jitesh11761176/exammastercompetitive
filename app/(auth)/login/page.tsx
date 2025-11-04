"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Chrome, Trophy, Target, Zap, Users, BookOpen } from "lucide-react"

const features = [
  {
    icon: Target,
    title: "Adaptive Learning",
    description: "AI-powered difficulty adjustment based on your performance"
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn badges, level up, and compete on leaderboards"
  },
  {
    icon: Zap,
    title: "Instant Analytics",
    description: "Real-time insights into your strengths and weaknesses"
  },
  {
    icon: Users,
    title: "Community",
    description: "Join thousands of aspirants and learn together"
  },
  {
    icon: BookOpen,
    title: "Vast Question Bank",
    description: "10,000+ questions across multiple competitive exams"
  }
]

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "95%", label: "Success Rate" },
  { value: "1M+", label: "Questions Solved" }
]

const testimonials = [
  {
    name: "Priya Sharma",
    exam: "SSC CGL 2023",
    text: "ExamMaster Pro's AI-powered tests helped me identify my weak areas and improve systematically.",
    avatar: "PS"
  },
  {
    name: "Rahul Kumar",
    exam: "IBPS PO 2023",
    text: "The gamification features kept me motivated throughout my preparation journey.",
    avatar: "RK"
  }
]

function LoginErrorBanner() {
  const searchParams = useSearchParams()
  const errorParam = searchParams?.get('error')
  if (!errorParam) return null
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950 dark:text-red-200">
      {errorParam === 'OAuthSignin' && 'OAuth Sign-in failed. Please try again.'}
      {errorParam === 'OAuthCallback' && 'OAuth callback failed. Check NEXTAUTH_URL, Google redirect URIs, and environment variables.'}
      {errorParam === 'OAuthAccountNotLinked' && 'Account exists with different sign-in method. Try another provider or contact support.'}
      {errorParam !== 'OAuthSignin' && errorParam !== 'OAuthCallback' && errorParam !== 'OAuthAccountNotLinked' && (
        <>Login error: <span className="font-mono">{errorParam}</span></>
      )}
    </div>
  )
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Error signing in:", error)
      setIsLoading(false)
    }
  }

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev: number) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Logo & Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ExamMaster Pro</h1>
          </div>
          <p className="text-white/90 text-lg">
            Your AI-Powered Competitive Exam Companion
          </p>
        </div>

        {/* Features Carousel */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === currentFeature ? 'opacity-100 block' : 'opacity-0 hidden'
                  }`}
                >
                  <feature.icon className="w-12 h-12 text-white mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {feature.description}
                  </p>
                </div>
              ))}
              
              {/* Indicators */}
              <div className="flex gap-2 mt-6">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentFeature 
                        ? 'w-8 bg-white' 
                        : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/80 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ExamMaster Pro
            </h1>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Auth error helper (wrapped in Suspense for useSearchParams) */}
          <Suspense fallback={null}>
            <LoginErrorBanner />
          </Suspense>

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome className="w-6 h-6" />
            )}
            <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Trusted by 50,000+ students
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {testimonial.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {testimonial.exam}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
