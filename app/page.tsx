import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await auth()
  const role = session?.user?.role
  switch (role) {
    case 'lecturer':
    case 'researcher':
      return redirect('/lecturer/courses')
    case 'student':
      return redirect('/student')
    default:
      return redirect('/login')
  }
}
