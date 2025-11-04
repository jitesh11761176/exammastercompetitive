'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CategoryDeleteButtonProps {
  categoryId: string
  categoryName: string
  hasContent: boolean
  questionsCount: number
  testsCount: number
}

export function CategoryDeleteButton({ 
  categoryId, 
  categoryName, 
  hasContent, 
  questionsCount,
  testsCount 
}: CategoryDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const confirmMessage = hasContent
      ? `⚠️ WARNING: This will permanently delete "${categoryName}" and ALL its content:\n\n` +
        `• ${questionsCount} Questions\n` +
        `• ${testsCount} Tests\n` +
        `• All Subjects and Topics\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Type "DELETE" to confirm:`
      : `Are you sure you want to delete "${categoryName}"?`

    const userConfirm = hasContent 
      ? prompt(confirmMessage)
      : confirm(confirmMessage)

    if (hasContent && userConfirm !== 'DELETE') {
      if (userConfirm !== null) {
        toast.error('Deletion cancelled. You must type "DELETE" to confirm.')
      }
      return
    }

    if (!hasContent && !userConfirm) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Category "${categoryName}" deleted successfully`)
        router.refresh()
      } else {
        toast.error(data.message || 'Failed to delete category')
      }
    } catch (error) {
      toast.error('Error deleting category')
      console.error('Delete error:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleDelete}
      disabled={deleting}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {deleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
