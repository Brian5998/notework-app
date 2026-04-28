import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans, DM_Serif_Display, Syne, DM_Mono } from 'next/font/google'
import { NotesProvider } from '@/lib/NotesContext'
import { LinksProvider } from '@/lib/LinksContext'
import { WorkspaceProvider } from '@/lib/WorkspaceContext'
import { ToastProvider } from '@/components/app/Toast'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
})

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata: Metadata = {
  title: 'Notework — Infrastructure for your knowledge',
  description:
    "Semantic search, contradiction detection, and concept linking across everything you've ever written.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${dmSerifDisplay.variable} ${syne.variable} ${dmMono.variable}`}
    >
      <body>
        <WorkspaceProvider>
          <NotesProvider>
            <LinksProvider>
              <ToastProvider>{children}</ToastProvider>
            </LinksProvider>
          </NotesProvider>
        </WorkspaceProvider>
      </body>
    </html>
  )
}
