import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IKIP - Industrial Knowledge Intelligence Platform',
  description: 'AI-powered industrial knowledge assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
