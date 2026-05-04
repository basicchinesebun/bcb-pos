import './globals.css'
import PwaHelper from './PwaHelper'

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
    <html lang="lo">
      <body>
        <PwaHelper />
        {children}
      </body>
    </html>
  )
}
