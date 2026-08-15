'use server'

import { signIn } from '@/lib/auth'
import { vi } from '@/lib/i18n/vi'

export type LoginState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email')
  const password = formData.get('password')
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/',
    })
    return { kind: 'idle' }
  } catch (error: unknown) {
    // Auth.js throws a redirect on success — if we reach here it's a real error
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('CredentialsSignin') || msg.includes('credentials')) {
      return { kind: 'error', message: vi.auth.invalidCredentials }
    }
    // Re-throw redirect errors so Next.js handles them
    throw error
  }
}
