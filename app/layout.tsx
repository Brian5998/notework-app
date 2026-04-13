import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import { NotesProvider } from '@/lib/NotesContext'
import { LinksProvider } from '@/lib/LinksContext'
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
      className={`${instrumentSerif.variable} ${dmSans.variable}`}
    >
      <body>
        <NotesProvider>
          <LinksProvider>{children}</LinksProvider>
        </NotesProvider>
      </body>
    </html>
  )
}
