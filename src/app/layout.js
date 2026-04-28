import './globals.css'

export const metadata = {
  title: 'Basic Chinese Bun',
  description: 'ຮ້ານຊາລາເປົາ Basic Chinese Bun',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="lo">
      <body>{children}</body>
    </html>
  )
}
