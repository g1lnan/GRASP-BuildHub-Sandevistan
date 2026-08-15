import { vi } from '@/lib/i18n/vi'
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const baloo2 = Baloo_2({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
})

export const metadata = {
  title: vi.metadata.title,
  description: vi.metadata.description,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${baloo2.variable} ${beVietnamPro.variable}`}>
      <body>{children}</body>
    </html>
  )
}
