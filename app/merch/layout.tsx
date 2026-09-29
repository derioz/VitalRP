import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://vitalrp.net'),
  title: 'Vital RP Official Store | Heavyweight Gear & Limited Drops',
  description:
    'Rep the city in style. Official Vital RP premium heavyweight hoodies, graphic tees, kiss-cut decals, and exclusive apparel. Handcrafted quality for Los Santos citizens.',
  keywords: [
    'Vital RP Merch',
    'VitalRP Store',
    'Vital RP FiveM Merch',
    'GTA RP Apparel',
    'FiveM Hoodies',
    'FiveM Clothing',
    'Vital Roleplay Shop',
    'Los Santos Merch',
  ],
  icons: {
    icon: [
      { url: 'https://r2.fivemanage.com/image/qlWrCeXTQdqx.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: 'https://r2.fivemanage.com/image/qlWrCeXTQdqx.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://vitalrp.net/merch',
    title: 'Vital RP Official Store | Heavyweight Gear & Limited Drops',
    siteName: 'Vital RP • Official Store',
    description:
      'Rep the city in style. Official Vital RP premium heavyweight hoodies, graphic tees, kiss-cut decals, and exclusive apparel. Handcrafted quality for Los Santos citizens.',
    images: [
      {
        url: 'https://r2.fivemanage.com/image/6NG24OsqzUct.png',
        width: 1200,
        height: 630,
        alt: 'Vital RP Official Merchandise Collection',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vital RP Official Store | Heavyweight Gear & Limited Drops',
    description:
      'Rep the city in style. Official Vital RP premium heavyweight hoodies, graphic tees, kiss-cut decals, and exclusive apparel.',
    images: ['https://r2.fivemanage.com/image/6NG24OsqzUct.png'],
  },
};

export default function MerchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
