'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ToolCard from '@/components/ui/ToolCard';
import AdBanner, { AD_SIZES } from '@/components/ui/AdBanner';
import { PDF_TOOLS, TOOL_CATEGORIES } from '@/lib/constants';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTools = selectedCategory === 'all'
    ? PDF_TOOLS
    : PDF_TOOLS.filter(tool => tool.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            PDFPro.pro
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Professional PDF Tools Online. 27 powerful tools to merge, split, convert, edit, and secure your PDF files.
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 text-sm">
              ✨ 100% Free
            </div>
            <div className="bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 text-sm">
              🔒 Secure & Private
            </div>
            <div className="bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 text-sm">
              ⚡ Fast Processing
            </div>
            <div className="bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 text-sm">
              📱 Mobile Friendly
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ad Banner - Header */}
      <div className="flex justify-center py-6 px-4">
        <AdBanner
          size="728x90"
          type="banner"
          showPlaceholder={true}
          className="hidden md:block"
        />
      </div>

      {/* Tools Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Category Filter */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
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
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-green-500 text-black glow-green'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.title}
              </button>
            ))}
          </motion.div>

          {/* Tools Grid with Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar Ads */}
            <div className="hidden lg:block space-y-6">
              <div className="sticky top-6">
                <AdBanner
                  size="160x600"
                  type="banner"
                  showPlaceholder={true}
                />
                <div className="mt-6">
                  <AdBanner
                    size="160x300"
                    type="banner"
                    showPlaceholder={true}
                  />
                </div>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="lg:col-span-2">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
                    <ToolCard {...tool} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Mid-content Ad */}
              <div className="flex justify-center mt-12">
                <AdBanner
                  size="468x60"
                  type="banner"
                  showPlaceholder={true}
                  className="hidden md:block"
                />
              </div>
            </div>

            {/* Right Sidebar Ads */}
            <div className="hidden lg:block space-y-6">
              <div className="sticky top-6">
                <AdBanner
                  size="300x250"
                  type="banner"
                  showPlaceholder={true}
                />
                <div className="mt-6">
                  <AdBanner
                    size="300x250"
                    type="banner"
                    showPlaceholder={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 text-green-400"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why Choose PDFPro.pro?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <h3 className="text-xl font-semibold mb-2 text-green-400">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Footer Ad */}
      <div className="flex justify-center py-6 px-4 md:hidden">
        <AdBanner
          size="320x50"
          type="banner"
          showPlaceholder={true}
        />
      </div>
    </div>
  );
}
