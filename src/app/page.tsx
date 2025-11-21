'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AdToolCard from '@/components/ui/AdToolCard';
import {
  AdBanner728x90,
  AdBanner300x250,
  AdBanner160x600,
} from '@/components/ads/AdComponents';
import { PDF_TOOLS, TOOL_CATEGORIES } from '@/lib/constants';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTools = selectedCategory === 'all'
    ? PDF_TOOLS
    : PDF_TOOLS.filter(tool => tool.category === selectedCategory);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="py-20 md:py-28 px-4 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            The All-in-One PDF Toolkit
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Merge, split, compress, convert, and edit your PDF files with ease.
          </motion.p>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2 rounded-full font-medium transition-colors text-sm ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Tools
            </button>
            {TOOL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2 rounded-full font-medium transition-colors text-sm ${
                  selectedCategory === category.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            layout
          >
            {filteredTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <AdToolCard {...tool} isPopular={false} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Ad Banner Section */}
      <div className="flex justify-center py-12 px-4 bg-white">
        <AdBanner728x90 />
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
            Why Choose PDFPro.pro?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Fast & Easy', description: 'Our tools are designed for speed and simplicity.', icon: '🚀' },
              { title: 'Secure & Private', description: 'Your files are safe with us and deleted after processing.', icon: '🛡️' },
              { title: 'High-Quality Results', description: 'Get professional-quality documents every time.', icon: '⭐' },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sidebar Ad Example (for reference) */}
      <aside className="hidden lg:block p-8">
          <div className="sticky top-8 space-y-8">
              <AdBanner160x600 />
              <AdBanner300x250 />
          </div>
      </aside>
    </div>
  );
}
