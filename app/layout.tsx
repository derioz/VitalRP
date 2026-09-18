import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vitalrp.net'),
  title: 'We Are Vital RP | Serious FiveM Roleplay',
  description:
    'Vital RP is a serious FiveM roleplay community built around characters, stories, and meaningful player-driven roleplay in Los Santos.',
  keywords: [
    'VitalRP',
    'Vital RP',
    'vitalrp.net',
    'Vital Roleplay',
    'vital rp fivem',
    'fivem rp server',
    'FiveM roleplay community',
    'GTA RP',
    'GTA V RP',
    'GTA FiveM RP',
    'Los Santos roleplay',
    'FiveM whitelist server',
    'serious roleplay fivem',
    'best fivem rp server',
    'story-first roleplay',
    'player-driven stories',
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
    url: 'https://vitalrp.net/',
    title: 'We Are Vital RP',
    siteName: 'Vital RP',
    description:
      'Serious roleplay built around characters, stories, and the choices that shape Los Santos. Create a character. Build a story. Leave your mark.',
    images: [
      {
        url: 'https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png',
        secureUrl: 'https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png',
        width: 1200,
        height: 630,
        alt: 'Vital RP - Serious FiveM Roleplay',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'We Are Vital RP',
    description:
      'Serious roleplay built around characters, stories, and the choices that shape Los Santos.',
    images: ['https://r2.fivemanage.com/image/T0Q31BrvyOVQ.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#faa200',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} scroll-smooth dark`}
    >
      <body className="bg-dark-950 text-white font-sans antialiased overflow-x-hidden selection:bg-vital-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
