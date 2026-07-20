import './globals.css'
import PwaHelper from './PwaHelper'
import { Noto_Serif_Lao, Playfair_Display } from 'next/font/google'

const notoSerifLao = Noto_Serif_Lao({
  subsets: ['lao'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-lao',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
  variable: '--font-serif',
})

export const metadata = {
  title: 'Basic Chinese Bun',
  description: 'ຮ້ານຊາລາເປົາ Basic Chinese Bun',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'only light',
}

export default function RootLayout({ children }) {
  return (
    <html lang="lo" className={`${notoSerifLao.variable} ${playfairDisplay.variable}`}>
      <body>
        <PwaHelper />
        {children}
      </body>
    </html>
  )
}
