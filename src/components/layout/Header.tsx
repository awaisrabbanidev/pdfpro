'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PDFPro.pro
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-300 hover:text-green-400 transition-colors font-medium"
            >
              Home
            </Link>
            <div className="relative group">
              <button className="text-gray-300 hover:text-green-400 transition-colors font-medium flex items-center">
                Tools
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-4">
                  <div className="space-y-2">
                    <Link href="/merge-pdf" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded">
                      Merge PDF
                    </Link>
                    <Link href="/split-pdf" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded">
                      Split PDF
                    </Link>
                    <Link href="/compress-pdf" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded">
                      Compress PDF
                    </Link>
                    <Link href="/pdf-to-word" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded">
                      PDF to Word
                    </Link>
                    <Link href="/edit-pdf" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded">
                      Edit PDF
                    </Link>
                    <Link href="/sign-pdf" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded">
                      Sign PDF
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/about"
              className="text-gray-300 hover:text-green-400 transition-colors font-medium"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-green-400 transition-colors font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button glow size="sm">
              Get Started Free
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-green-400 transition-colors p-2"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-gray-900 border-t border-gray-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md font-medium"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <div className="px-3 py-2 text-gray-400 text-sm font-medium">Popular Tools:</div>
              <Link
                href="/merge-pdf"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md"
                onClick={toggleMenu}
              >
                Merge PDF
              </Link>
              <Link
                href="/split-pdf"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md"
                onClick={toggleMenu}
              >
                Split PDF
              </Link>
              <Link
                href="/compress-pdf"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md"
                onClick={toggleMenu}
              >
                Compress PDF
              </Link>
              <Link
                href="/pdf-to-word"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md"
                onClick={toggleMenu}
              >
                PDF to Word
              </Link>
              <Link
                href="/edit-pdf"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md"
                onClick={toggleMenu}
              >
                Edit PDF
              </Link>
              <Link
                href="/sign-pdf"
                className="block px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-green-400 rounded-md"
                onClick={toggleMenu}
              >
                Sign PDF
              </Link>
              <div className="pt-4 pb-2">
                <Button size="sm" className="w-full justify-center" glow>
                  Get Started Free
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;