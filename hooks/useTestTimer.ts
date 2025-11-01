'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseTestTimerReturn {
  timeLeft: number
  isPaused: boolean
  pause: () => void
  resume: () => void
  formatTime: () => string
  getProgress: () => number
}

export function useTestTimer(
  durationInMinutes: number,
  onExpire: () => void
): UseTestTimerReturn {
  const totalSeconds = durationInMinutes * 60
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const onExpireRef = useRef(onExpire)

  // Update ref when callback changes
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpireRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])

  const formatTime = useCallback(() => {
    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [timeLeft])

  const getProgress = useCallback(() => {
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }, [timeLeft, totalSeconds])

  return {
    timeLeft,
    isPaused,
    pause,
    resume,
    formatTime,
    getProgress,
  }
}
