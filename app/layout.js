import './globals.css'
import { Inter, Outfit } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata = {
  title: 'Prompt Engineering Toolkit | Elite',
  description: 'AI Prompt Versioning and Evaluation Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className} suppressHydrationWarning>{children}</body>
    </html>
  )
}
