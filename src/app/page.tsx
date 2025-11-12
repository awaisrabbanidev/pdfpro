'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AdToolCard from '@/components/ui/AdToolCard';
import {
  AdBanner728x90,
  AdBanner300x250,
  AdBanner160x600,
  AdBanner160x300,
  AdBanner468x60,
  AdBanner320x50,
  NativeBannerAd,
  PopUnderAd,
  SocialBarAd,
  SmartLinkAd
} from '@/components/ads/AdComponents';
import { PDF_TOOLS, TOOL_CATEGORIES } from '@/lib/constants';

// Most popular tools that get first-click ad treatment
const POPULAR_TOOLS = ['pdf-to-word', 'merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-jpg'];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTools = selectedCategory === 'all'
    ? PDF_TOOLS
    : PDF_TOOLS.filter(tool => tool.category === selectedCategory);

  return (
    <>
      {/* Global Ads - Popunder and Social Bar */}
      <PopUnderAd />
      <SocialBarAd />

      <div className="bg-black text-gray-100 pt-0">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <div className="relative max-w-6xl mx-auto">
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              PDFPro.pro
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Professional PDF Tools Online. 27 powerful tools to merge, split, convert, edit, and secure your PDF files.
            </motion.p>

            {/* SmartLink Ad */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SmartLinkAd className="w-full max-w-md" />
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center gap-3 md:gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-green-500/20 border border-green-500/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-green-400 text-xs md:text-sm">
                ✨ 100% Free
              </div>
              <div className="bg-green-500/20 border border-green-500/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-green-400 text-xs md:text-sm">
                🔒 Secure & Private
              </div>
              <div className="bg-green-500/20 border border-green-500/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-green-400 text-xs md:text-sm">
                ⚡ Fast Processing
              </div>
              <div className="bg-green-500/20 border border-green-500/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-green-400 text-xs md:text-sm">
                📱 Mobile Friendly
              </div>
              <div className="bg-orange-500/20 border border-orange-500/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-orange-400 text-xs md:text-sm animate-pulse">
                💰 Bonus Rewards
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main 728x90 Banner Ad - Above Tools */}
        <div className="flex justify-center py-4 px-4 bg-gray-900/30">
          <AdBanner728x90 placeholder={false} />
        </div>

        {/* Tools Section */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Category Filter */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 md:px-6 py-2 rounded-full font-medium transition-all text-sm md:text-base ${
                  selectedCategory === 'all'
                    ? 'bg-green-500 text-black glow-green'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All Tools ({PDF_TOOLS.length})
              </button>
              {TOOL_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 md:px-6 py-2 rounded-full font-medium transition-all text-sm md:text-base ${
                    selectedCategory === category.id
                      ? 'bg-green-500 text-black glow-green'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category.title}
                </button>
              ))}
            </motion.div>

            {/* Advanced Ad + Tools Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Sidebar - Desktop Ads */}
              <div className="hidden xl:block xl:col-span-3 space-y-6">
                <div className="sticky top-6">
                  <AdBanner160x600 placeholder={false} />
                  <div className="mt-6">
                    <AdBanner160x300 placeholder={false} />
                  </div>
                  <div className="mt-6">
                    <AdBanner300x250 placeholder={false} />
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="xl:col-span-6">
                {/* Native Banner Ad - Top of Tools */}
                <div className="mb-6">
                  <NativeBannerAd />
                </div>

                {/* Tools Grid */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                  layout
                >
                  {filteredTools.map((tool, index) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        layout: { duration: 0.3 }
                      }}
                    >
                      <AdToolCard
                        {...tool}
                        isPopular={POPULAR_TOOLS.includes(tool.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Mid-content 468x60 Banner */}
                <div className="flex justify-center mt-8 mb-6">
                  <AdBanner468x60 placeholder={false} />
                </div>

                {/* Mobile Ad - 320x50 */}
                <div className="flex justify-center xl:hidden mt-6">
                  <AdBanner320x50 placeholder={false} />
                </div>
              </div>

              {/* Right Sidebar - More Ads */}
              <div className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-6">
                <div className="sticky top-6">
                  <AdBanner300x250 placeholder={true} />
                  <div className="mt-6">
                    <AdBanner300x250 placeholder={true} />
                  </div>
                  <div className="mt-6">
                    <AdBanner160x300 placeholder={true} />
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Ad - Always Visible on Mobile */}
              <div className="xl:hidden col-span-1 mt-6">
                <div className="sticky bottom-4">
                  <AdBanner320x50 placeholder={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Ad Integration */}
        <section className="py-16 md:py-20 px-4 bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-green-400"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Why Choose PDFPro.pro?
            </motion.h2>

            {/* Featured Content Ad */}
            <div className="flex justify-center mb-12">
              <NativeBannerAd />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: 'Advanced Technology',
                  description: 'Powered by cutting-edge PDF processing technology for accurate and fast results.',
                  icon: '🚀'
                },
                {
                  title: 'Complete Privacy',
                  description: 'Your files are processed locally and automatically deleted after 2 hours.',
                  icon: '🛡️'
                },
                {
                  title: 'Professional Results',
                  description: 'High-quality output that maintains formatting and document integrity.',
                  icon: '⭐'
                },
                {
                  title: 'No Registration',
                  description: 'Start processing your PDFs immediately without creating an account.',
                  icon: '🎯'
                },
                {
                  title: 'Cross-Platform',
                  description: 'Works on Windows, Mac, Linux, iOS, and Android devices.',
                  icon: '🌍'
                },
                {
                  title: 'Free Forever',
                  description: 'No hidden costs, subscription fees, or usage limits.',
                  icon: '💎'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-green-500/50 transition-all"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-green-400">{feature.title}</h3>
                  <p className="text-gray-400 text-sm md:text-base">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Bottom Banner Section */}
            <div className="mt-12 flex flex-col items-center space-y-4">
              <AdBanner728x90 placeholder={false} />
              <div className="text-center">
                <p className="text-gray-500 text-xs">
                  🎯 Special offers and premium tools available - Click ads to unlock exclusive features!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Ad Section */}
        <div className="py-8 px-4 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex justify-center md:justify-start">
                <AdBanner300x250 placeholder={false} />
              </div>
              <div className="flex justify-center">
                <AdBanner320x50 placeholder={false} />
              </div>
              <div className="flex justify-center md:justify-end">
                <AdBanner300x250 placeholder={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}