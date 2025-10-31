'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export interface UseAutoSaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  saveNow: () => Promise<void>
}

export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  interval = 30000 // 30 seconds
): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const savedDataRef = useRef<string>(JSON.stringify(data))
  const onSaveRef = useRef(onSave)

  // Update ref when callback changes
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const saveNow = useCallback(async () => {
    const currentData = JSON.stringify(data)
    
    // Only save if data has changed
    if (currentData === savedDataRef.current) {
      return
    }

    setIsSaving(true)
    try {
      await onSaveRef.current(data)
      savedDataRef.current = currentData
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [data])

  // Auto-save on interval
  useEffect(() => {
    const timer = setInterval(() => {
      saveNow()
    }, interval)

    return () => clearInterval(timer)
  }, [saveNow, interval])

  // Save on unmount
  useEffect(() => {
    return () => {
      // Fire and forget on unmount
      const currentData = JSON.stringify(data)
      if (currentData !== savedDataRef.current) {
        onSaveRef.current(data).catch(console.error)
      }
    }
  }, [data])

  return {
    isSaving,
    lastSaved,
    saveNow,
  }
}
