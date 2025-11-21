import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "PDFPro.pro - The All-in-One PDF Toolkit",
  description: "Merge, split, compress, convert, and edit your PDF files with ease. 27 powerful and free tools to manage your PDFs online. Secure, private, and fast.",
  keywords: ["PDF", "PDF tools", "merge PDF", "split PDF", "compress PDF", "convert PDF", "PDF to Word", "PDF to JPG", "edit PDF", "online PDF editor", "free PDF tools", "PDF converter", "unlock PDF", "protect PDF", "rotate PDF", "add page numbers"],
  authors: [{ name: "PDFPro.pro" }],
  creator: "PDFPro.pro",
  publisher: "PDFPro.pro",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.pdfpro.pro",
    title: "PDFPro.pro - The All-in-One PDF Toolkit",
    description: "Merge, split, compress, convert, and edit your PDF files with ease. 27 powerful and free tools to manage your PDFs online.",
    siteName: "PDFPro.pro",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PDFPro.pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFPro.pro - The All-in-One PDF Toolkit",
    description: "Merge, split, compress, convert, and edit your PDF files with ease.",
    images: ["/twitter-image.png"],
  },
  alternates: { canonical: "https://www.pdfpro.pro" },
  other: { "theme-color": "#e53e3e", "msapplication-TileColor": "#e53e3e" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PDFPro.pro",
  url: "https://www.pdfpro.pro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50 text-gray-800 antialiased">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
