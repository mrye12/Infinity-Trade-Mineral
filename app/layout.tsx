import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Navigation from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Infinity Trade Mineral - Internal Portal',
  description: 'Internal company website for document and invoice management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
