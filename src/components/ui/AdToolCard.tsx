'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AdBanner300x250 } from '../ads/AdComponents';

interface AdToolCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  className?: string;
  isPopular?: boolean;
}

const POPULAR_TOOLS = [
  'pdf-to-word',
  'merge-pdf',
  'split-pdf',
  'compress-pdf',
  'pdf-to-jpg'
];

const AdToolCard: React.FC<AdToolCardProps> = ({
  title,
  description,
  icon,
  href,
  color = 'green',
  className = '',
  isPopular = false
}) => {
  const router = useRouter();
  const [showAd, setShowAd] = useState(false);
  const [hasSeenAd, setHasSeenAd] = useState(false);

  const handleClick = () => {
    if (isPopular && !hasSeenAd) {
      setShowAd(true);
      setHasSeenAd(true);
      // Auto-navigate after 3 seconds
      setTimeout(() => {
        setShowAd(false);
        router.push(href);
      }, 3000);
    } else {
      router.push(href);
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'hover:border-green-500/50 hover:shadow-green-500/20';
      case 'blue':
        return 'hover:border-blue-500/50 hover:shadow-blue-500/20';
      case 'purple':
        return 'hover:border-purple-500/50 hover:shadow-purple-500/20';
      case 'orange':
        return 'hover:border-orange-500/50 hover:shadow-orange-500/20';
      case 'red':
        return 'hover:border-red-500/50 hover:shadow-red-500/20';
      default:
        return 'hover:border-green-500/50 hover:shadow-green-500/20';
    }
  };

  if (showAd) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative"
      >
        <div className="text-center mb-4">
          <p className="text-green-400 font-medium text-sm">🎯 Special Offer Before You Continue!</p>
          <p className="text-gray-400 text-xs mt-1">Opening tool in 3 seconds...</p>
        </div>
        <AdBanner300x250
          className="mx-auto"
          placeholder={false}
        />
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setShowAd(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Skip Ad
          </button>
          <button
            onClick={() => {
              setShowAd(false);
              router.push(href);
            }}
            className="text-xs text-green-500 hover:text-green-400 transition-colors font-medium"
          >
            Continue Now
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${getColorClasses()} ${className}`}
      onClick={handleClick}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          🔥 Popular
        </div>
      )}

      {/* First click indicator for popular tools */}
      {isPopular && !hasSeenAd && (
        <div className="absolute top-2 left-2 bg-green-500/20 border border-green-500/50 text-green-400 text-xs px-2 py-1 rounded-full">
          💰 Bonus
        </div>
      )}

      <div className={`text-4xl mb-4 ${
        color === 'green' ? 'text-green-500 hover:text-green-400' :
        color === 'blue' ? 'text-blue-500 hover:text-blue-400' :
        color === 'purple' ? 'text-purple-500 hover:text-purple-400' :
        color === 'orange' ? 'text-orange-500 hover:text-orange-400' :
        'text-red-500 hover:text-red-400'
      } transition-colors`}>
        {icon}
      </div>

      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
        {title}
      </h3>

      <p className="text-gray-400 text-sm leading-relaxed mb-4">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-green-500 text-sm font-medium group-hover:text-green-400 transition-colors">
          Use Tool
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {isPopular && !hasSeenAd && (
          <div className="text-xs text-green-500 font-medium animate-pulse">
            Click for bonus!
          </div>
        )}
      </div>

      {/* Hover effect background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        color === 'green' ? 'from-green-500/5 to-transparent' :
        color === 'blue' ? 'from-blue-500/5 to-transparent' :
        color === 'purple' ? 'from-purple-500/5 to-transparent' :
        color === 'orange' ? 'from-orange-500/5 to-transparent' :
        'from-red-500/5 to-transparent'
      } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  );
};

export default AdToolCard;