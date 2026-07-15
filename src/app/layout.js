import './globals.css'
import PwaHelper from './PwaHelper'

export const metadata = {
  title: 'Basic Chinese Bun',
  description: 'ຮ້ານຊາລາເປົາ Basic Chinese Bun',
}

// Fonts injected as <link> to avoid render-blocking @import in CSS (critical for Safari)
const FONT_PRECONNECT = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
]
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Lao:wght@400;700;900&family=Playfair+Display:wght@700;900&display=swap'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'only light',
}

export default function RootLayout({ children }) {
  return (
    <html lang="lo">
      <head>
        {FONT_PRECONNECT.map(p => <link key={p.href} {...p} />)}
        <link rel="stylesheet" href={FONT_HREF} />
      </head>
      <body>
        <PwaHelper />
        {children}
      </body>
    </html>
  )
}
