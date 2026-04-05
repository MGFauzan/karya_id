import './globals.css'

export const metadata = {
  title:       'KARYA.ID — Platform Kerja Inklusif Berbasis AI',
  description: 'Menghubungkan talenta SMK, TKI, Petani, dan Difabel ke lapangan kerja layak melalui AI matching.',
  keywords:    'lowongan kerja, SMK, TKI, petani, difabel, AI matching, karir inklusif',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
