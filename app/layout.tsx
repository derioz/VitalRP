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
  title: 'Vital RP | Story-first FiveM Roleplay Community',
  description:
    'Vital RP is a premium FiveM roleplay community focused on storytelling, character development, and immersive high-quality interactions in Los Santos. Join today.',
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
    'semi-serious roleplay fivem',
    'best fivem rp server',
    'story-first roleplay',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: 'https://vitalrp.net/',
    title: 'Vital RP | Story-first FiveM Roleplay Community',
    description:
      'Vital RP is a premium FiveM roleplay community focused on storytelling, character development, and immersive high-quality interactions in Los Santos. Join today.',
    siteName: 'Vital RP',
    images: [
      {
        url: 'https://r2.fivemanage.com/image/nABguUthLZVW.png',
        width: 1200,
        height: 630,
        alt: 'Vital RP — FiveM Roleplay Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vital RP | Story-first FiveM Roleplay Community',
    description:
      'Vital RP is a premium FiveM roleplay community focused on storytelling, character development, and immersive high-quality interactions in Los Santos. Join today.',
    images: ['https://r2.fivemanage.com/image/nABguUthLZVW.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
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
