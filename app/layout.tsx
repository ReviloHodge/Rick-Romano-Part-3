import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'Rick Romano',
  description: 'Auto-podcast for your fantasy league'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
