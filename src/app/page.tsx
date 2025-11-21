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
      <div className="min-h-screen w-full glow-effect">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative max-w-6xl mx-auto">
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              PDFPro.pro
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Your Complete PDF Toolkit. 27 powerful tools to merge, split, convert, edit, and secure your PDF files.
            </motion.p>

            <div className="siri-wave mb-8">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>

            {/* SmartLink Ad */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <SmartLinkAd className="w-full max-w-md" />
            </motion.div>
          </div>
        </section>

        {/* Main 728x90 Banner Ad - Above Tools */}
        <div className="flex justify-center py-6 px-4">
          <AdBanner728x90 placeholder={false} />
        </div>

        {/* Tools Section */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Category Filter */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 md:mb-14"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 md:px-7 py-2.5 rounded-full font-medium transition-all text-sm md:text-base glass-card ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                All Tools ({PDF_TOOLS.length})
              </button>
              {TOOL_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 md:px-7 py-2.5 rounded-full font-medium transition-all text-sm md:text-base glass-card ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800/50'
                  }`}
                >
                  {category.title}
                </button>
              ))}
            </motion.div>

            {/* Advanced Ad + Tools Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
              {/* Left Sidebar - Desktop Ads */}
              <div className="hidden xl:block xl:col-span-3 space-y-8">
                <div className="sticky top-8">
                  <AdBanner160x600 placeholder={false} />
                  <div className="mt-8">
                    <AdBanner160x300 placeholder={false} />
                  </div>
                  <div className="mt-8">
                    <AdBanner300x250 placeholder={false} />
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="xl:col-span-6">
                {/* Native Banner Ad - Top of Tools */}
                <div className="mb-8">
                  <NativeBannerAd />
                </div>

                {/* Tools Grid */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
                  layout
                >
                  {filteredTools.map((tool, index) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.07,
                        layout: { duration: 0.4 }
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
                <div className="flex justify-center mt-10 mb-8">
                  <AdBanner468x60 placeholder={false} />
                </div>

                {/* Mobile Ad - 320x50 */}
                <div className="flex justify-center xl:hidden mt-8">
                  <AdBanner320x50 placeholder={false} />
                </div>
              </div>

              {/* Right Sidebar - More Ads */}
              <div className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-8">
                <div className="sticky top-8">
                  <AdBanner300x250 placeholder={false} />
                  <div className="mt-8">
                    <AdBanner300x250 placeholder={false} />
                  </div>
                  <div className="mt-8">
                    <AdBanner160x300 placeholder={false} />
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Ad - Always Visible on Mobile */}
              <div className="xl:hidden col-span-1 mt-8">
                <div className="sticky bottom-6">
                  <AdBanner320x50 placeholder={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Ad Integration */}
        <section className="py-20 md:py-24 px-4 bg-black/50">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-14 md:mb-20 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Why PDFPro.pro?
            </motion.h2>

            {/* Featured Content Ad */}
            <div className="flex justify-center mb-14">
              <NativeBannerAd />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
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
                  className="text-center p-8 glass-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="text-5xl mb-5">{feature.icon}</div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-3 text-blue-400">{feature.title}</h3>
                  <p className="text-gray-400 text-sm md:text-base">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Bottom Banner Section */}
            <div className="mt-14 flex flex-col items-center space-y-5">
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
        <div className="py-10 px-4 bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
