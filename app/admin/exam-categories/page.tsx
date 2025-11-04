import { redirect } from 'next/navigation'

// This page has been deprecated in favor of the new Course -> Category -> Test hierarchy
// Redirecting to the new courses management page
export default function AdminExamCategoriesPage() {
  redirect('/admin/courses')
}
