import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SEO_CONFIG } from "@/lib/constants";

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.url),
  title: SEO_CONFIG.title,
  description: SEO_CONFIG.description,
  keywords: SEO_CONFIG.keywords,
  authors: [{ name: SEO_CONFIG.siteName }],
  creator: SEO_CONFIG.siteName,
  publisher: SEO_CONFIG.siteName,
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SEO_CONFIG.url,
    title: SEO_CONFIG.title,
    description: SEO_CONFIG.description,
    siteName: SEO_CONFIG.siteName,
    images: [
      {
        url: SEO_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SEO_CONFIG.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_CONFIG.title,
    description: SEO_CONFIG.description,
    images: [SEO_CONFIG.ogImage],
  },
  alternates: {
    canonical: SEO_CONFIG.url,
  },
  other: {
    "theme-color": "#F72585", // Updated theme color
    "msapplication-TileColor": "#0D1117", // Updated background
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SEO_CONFIG.siteName,
  description: SEO_CONFIG.description,
  url: SEO_CONFIG.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SEO_CONFIG.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
