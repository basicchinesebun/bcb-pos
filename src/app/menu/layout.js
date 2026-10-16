// This link's whole job is to be pasted — pinned at the top of a Facebook
// live, forwarded in WhatsApp. What those apps show is the card built from
// these tags, not the page, so the card is part of the feature: without it
// Facebook falls back to the site-wide title and whatever image it scrapes,
// and the comment reads as a bare URL nobody taps.
const SITE = 'https://www.basicchinesebun.com'
const TITLE = 'ເມນູມື້ນີ້ · Basic Chinese Bun'
const DESC = 'ເບິ່ງວ່າມື້ນີ້ໜ້າຮ້ານມີຫຍັງແດ່ ແລະ ເຫຼືອເທົ່າໃດ — ອັບເດດສົດຈາກໜ້າຮ້ານ'

export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/menu' },
  openGraph: {
    type: 'website',
    url: `${SITE}/menu`,
    siteName: 'Basic Chinese Bun',
    title: TITLE,
    description: DESC,
    locale: 'lo_LA',
    // A card drawn for the job rather than the shop logo: logo.jpg is square,
    // and a square image in a 1.91:1 slot gets its top and bottom cropped off,
    // which on this one would take the bun and the wordmark with them.
    images: [{ url: '/og-menu.jpg', width: 1200, height: 630, alt: 'ເມນູມື້ນີ້ · Basic Chinese Bun' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: ['/og-menu.jpg'],
  },
  // A stock board is only ever worth reading now, and a search engine serving
  // a cached copy of it would show numbers from whenever it last crawled.
  robots: { index: false, follow: true },
}

export default function MenuLayout({ children }) {
  return children
}
