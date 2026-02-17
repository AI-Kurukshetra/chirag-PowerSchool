import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

export const metadata: Metadata = {
  title: 'PowerSchool — Admin Dashboard',
  description: 'School management system with attendance, fees, and reports.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="bg-midnight text-white">
        {children}
      </body>
    </html>
  )
}
