'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TestDeleteButtonProps {
  testId: string
  testName: string
}

export function TestDeleteButton({ testId, testName }: TestDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${testName}"? This action cannot be undone and will delete all associated questions and attempts.`)) {
      return
    }

    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete test')
      }

      toast.success(`Test "${testName}" deleted successfully`)
      router.refresh() // Refresh the page to show updated list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete test')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
