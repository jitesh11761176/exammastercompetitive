"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  lectureId: string
  videoId: string // Cloudflare Stream video ID
  title?: string
  autoPlay?: boolean
  onProgressUpdate?: (progress: number, isCompleted: boolean) => void
  className?: string
}

export function VideoPlayer({
  lectureId,
  videoId,
  title,
  onProgressUpdate,
  className
}: VideoPlayerProps) {
  const { data: session } = useSession()
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [lastSavedProgress, setLastSavedProgress] = useState(0)

  // Cloudflare Stream iframe URL
  const streamUrl = `https://customer-${process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN || 'demo'}.cloudflarestream.com/${videoId}/iframe?preload=true&autoplay=false`

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!session?.user) return

      try {
        const response = await fetch(`/api/lectures/${lectureId}/progress`)
        if (response.ok) {
          const data = await response.json()
          if (data.watchedDuration) {
            setLastSavedProgress(data.watchedDuration)
            setCurrentTime(data.watchedDuration)
          }
          if (data.isCompleted) {
            setIsCompleted(true)
          }
        }
      } catch (error) {
        console.error("Failed to load progress:", error)
      }
    }

    loadProgress()
    setIsLoading(false) // Cloudflare Stream handles loading state
  }, [lectureId, session])

  const saveProgress = useCallback(async () => {
    if (!session?.user || !currentTime || !duration) return

    const watchedDuration = Math.floor(currentTime)
    const totalDuration = Math.floor(duration)

    // Only save if progress has changed by at least 5 seconds
    if (Math.abs(watchedDuration - lastSavedProgress) < 5) return

    try {
      const response = await fetch(`/api/lectures/${lectureId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchedDuration,
          totalDuration
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLastSavedProgress(watchedDuration)
        
        // Check if video was just completed
        if (data.progress.isCompleted && !isCompleted) {
          setIsCompleted(true)
          toast.success("🎉 Lecture Completed!", {
            description: "Your progress has been saved"
          })
          
          if (onProgressUpdate) {
            onProgressUpdate(100, true)
          }
        } else if (onProgressUpdate) {
          const progressPercent = (watchedDuration / totalDuration) * 100
          onProgressUpdate(progressPercent, false)
        }
      }
    } catch (error) {
      console.error("Failed to save progress:", error)
    }
  }, [lectureId, session, currentTime, duration, lastSavedProgress, isCompleted, onProgressUpdate])

  // Listen to Cloudflare Stream events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Cloudflare Stream sends events about video playback
      if (event.data && typeof event.data === 'object') {
        if (event.data.event === 'timeupdate') {
          setCurrentTime(event.data.currentTime || 0)
          setDuration(event.data.duration || 0)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Save progress every 10 seconds
  useEffect(() => {
    if (!session?.user) return

    progressIntervalRef.current = setInterval(() => {
      saveProgress()
    }, 10000) // Save every 10 seconds

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [session, saveProgress])

  // Save progress before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [saveProgress])

  return (
    <div 
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
    >
      {/* Video Element (Cloudflare Stream) */}
      <div className="relative aspect-video">
        <iframe
          src={streamUrl}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
        
        {/* Cloudflare Stream handles its own controls, but we can add custom overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}

        {isCompleted && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>

      {/* Custom Controls (Optional - Cloudflare Stream has built-in controls) */}
      {/* 
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={isPlaying ? handlePause : handlePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24 cursor-pointer"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      */}

      {title && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
      )}
    </div>
  )
}
