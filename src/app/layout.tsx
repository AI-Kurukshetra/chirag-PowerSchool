import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PowerSchool — Admin Dashboard',
  description: 'School management system with attendance, fees, and reports.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-midnight text-white">
        {children}
      </body>
    </html>
  )
}
