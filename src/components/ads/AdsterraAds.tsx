'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAdDomain } from '@/lib/url-config';

// Adsterra Ad Configuration for pdfpro.pro domain
const ADSTERRA_CONFIG = {
  '300x250': {
    key: 'ba27940e74baf283d86f8660cae41d24',
    width: 300,
    height: 250,
    format: 'iframe'
  },
  '728x90': {
    key: '8ec7631dfd51068968dbd73089bf3b26',
    width: 728,
    height: 90,
    format: 'iframe'
  },
  '160x600': {
    key: 'a384d2956c86a7fd01d08db11eb8584c',
    width: 160,
    height: 600,
    format: 'iframe'
  },
  '160x300': {
    key: 'df90677345a5b60bbb29cbe4970f2242',
    width: 160,
    height: 300,
    format: 'iframe'
  },
  '468x60': {
    key: '849d38461fd2bd641c5a7c889b44521d',
    width: 468,
    height: 60,
    format: 'iframe'
  },
  '320x50': {
    key: 'c4633a11d683cbe2bec94da10f617f82',
    width: 320,
    height: 50,
    format: 'iframe'
  },
  'native': {
    key: '4ee2e015b5e12a0b82a78c55fe1390e0',
    width: 800,
    height: 250,
    format: 'iframe'
  },
  'social-bar': {
    key: '2c72d65c6c0fc08d068958290629b221',
    width: 300,
    height: 100,
    format: 'iframe'
  },
  'popunder': {
    key: '8520b76c59e47b89674e8026a10d479d',
    width: 1,
    height: 1,
    format: 'popunder'
  },
  'smartlink': {
    key: 'a8803f7b51b4e8b17f8e6be8c5f2c0d9',
    width: 1,
    height: 1,
    format: 'link'
  }
};

interface AdsterraAdProps {
  size: keyof typeof ADSTERRA_CONFIG;
  type?: 'banner' | 'native' | 'popunder' | 'social-bar' | 'smartlink';
  className?: string;
  showPlaceholder?: boolean;
  zone?: string;
}

const AdsterraAd: React.FC<AdsterraAdProps> = ({
  size,
  type = 'banner',
  className = '',
  showPlaceholder = false,
  zone = ''
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const adConfig = ADSTERRA_CONFIG[size];
  const currentDomain = getAdDomain();

  useEffect(() => {
    // Only load ads on production domains
    if (currentDomain === 'localhost' || showPlaceholder) {
      return;
    }

    // Validate domain for Adsterra
    if (!['pdfpro.pro', 'www.pdfpro.pro'].includes(currentDomain)) {
      console.warn(`Adsterra ads disabled for domain: ${currentDomain}`);
      setAdError(true);
      return;
    }

    const timer = setTimeout(() => {
      try {
        // Set global atOptions exactly as Adsterra expects
        (window as any).atOptions = {
          key: adConfig.key,
          format: adConfig.format,
          width: adConfig.width,
          height: adConfig.height,
          params: zone ? { zone } : {}
        };

        // Load the exact Adsterra script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `//www.highperformanceformat.com/${adConfig.key}/invoke.js`;
        script.async = true;

        script.onload = () => {
          setAdLoaded(true);
          console.log(`🚀 Adsterra ad loaded: ${size} (${adConfig.width}x${adConfig.height}) on ${currentDomain}`);
        };

        script.onerror = () => {
          setAdError(true);
          console.error('❌ Adsterra ad loading failed');
        };

        document.head.appendChild(script);

      } catch (error) {
        setAdError(true);
        console.error('❌ Adsterra ad setup error:', error);
      }
    }, 1000); // Load ads after 1 second

    return () => {
      clearTimeout(timer);
    };
  }, [adConfig, currentDomain, showPlaceholder, size, zone]);

  // Show placeholder in development or if there's an error
  if (showPlaceholder || currentDomain === 'localhost' || adError) {
    return (
      <div
        className={`bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center ${className}`}
        style={{
          width: adConfig.width,
          height: adConfig.height,
          minWidth: adConfig.width,
          minHeight: adConfig.height
        }}
      >
        <div className="text-center p-2">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
            Advertisement
          </div>
          <div className="text-gray-600 text-xs">
            {adConfig.width}×{adConfig.height}
            {adError && ' (Error loading)'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        width: adConfig.width,
        height: adConfig.height,
        minWidth: adConfig.width,
        minHeight: adConfig.height
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: adLoaded ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Adsterra ad container */}
      <div
        id={`adsterra-${size}-${zone}`}
        className="w-full h-full"
        data-ad-size={size}
        data-ad-domain={currentDomain}
      />

      {/* Ad label */}
      <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 text-xs">
        Ad
      </div>

      {/* Loading state */}
      {!adLoaded && !adError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="text-gray-400 text-xs">Loading ad...</div>
        </div>
      )}
    </motion.div>
  );
};

// Specific Ad Components
export const AdBanner300x250: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = (props) => (
  <AdsterraAd size="300x250" {...props} />
);

export const AdBanner728x90: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = (props) => (
  <AdsterraAd size="728x90" {...props} />
);

export const AdBanner160x600: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = (props) => (
  <AdsterraAd size="160x600" {...props} />
);

export const AdBanner160x300: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = (props) => (
  <AdsterraAd size="160x300" {...props} />
);

export const AdBanner468x60: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = (props) => (
  <AdsterraAd size="468x60" {...props} />
);

export const AdBanner320x50: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = (props) => (
  <AdsterraAd size="320x50" {...props} />
);

// Native Banner Ad (more reliable)
export const NativeBannerAd: React.FC<{ className?: string; showPlaceholder?: boolean; zone?: string }> = ({ className = '', showPlaceholder = false, zone = 'native' }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const currentDomain = getAdDomain();

  useEffect(() => {
    // Only load ads on production domains
    if (currentDomain === 'localhost' || showPlaceholder) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        // Load exact Adsterra Native Banner script
        (window as any).atOptions = {
          key: '4ee2e015b5e12a0b82a78c55fe1390e0',
          format: 'iframe',
          width: 800,
          height: 250
        };

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//www.highperformanceformat.com/4ee2e015b5e12a0b82a78c55fe1390e0/invoke.js';
        script.async = true;

        script.onload = () => {
          setAdLoaded(true);
          console.log('🚀 Adsterra Native Banner 4:1 loaded on', currentDomain);
        };

        document.head.appendChild(script);

      } catch (error) {
        console.log('🚀 Adsterra Native Banner loading skipped (client-side only)');
        setAdLoaded(true); // Consider it loaded to avoid infinite loading
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentDomain, showPlaceholder]);

  if (showPlaceholder || currentDomain === 'localhost') {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center ${className}`} style={{ width: 800, height: 250 }}>
        <div className="text-center p-4">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">Native Banner Ad (800×250)</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: 800, height: 250 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Exact Adsterra container for Native Banner 4:1 */}
      <div
        id="adsterra-native-banner"
        className="w-full h-full"
        data-ad-type="native"
        data-ad-domain={currentDomain}
      />

      <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5">
        Ad
      </div>
    </motion.div>
  );
};

// PopUnder Ad (client-side only)
export const PopUnderAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const currentDomain = getAdDomain();

  useEffect(() => {
    if (currentDomain === 'localhost') return;

    try {
      // Load exact Adsterra PopUnder script
      (window as any).atOptions = {
        key: '8520b76c59e47b89674e8026a10d479d',
        format: 'popunder'
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//www.highperformanceformat.com/8520b76c59e47b89674e8026a10d479d/invoke.js';
      script.async = true;

      document.head.appendChild(script);
      console.log('🚀 Adsterra PopUnder Ad loaded on', currentDomain);

    } catch (error) {
      console.log('🚀 Adsterra PopUnder loading skipped (client-side only)');
    }
  }, [currentDomain]);

  return null; // PopUnder ads don't display visible content
};

// Social Bar Ad (client-side only)
export const SocialBarAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const currentDomain = getAdDomain();

  useEffect(() => {
    if (currentDomain === 'localhost') return;

    try {
      // Load exact Adsterra Social Bar script
      (window as any).atOptions = {
        key: '2c72d65c6c0fc08d068958290629b221',
        format: 'iframe',
        width: 300,
        height: 100
      };

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//www.highperformanceformat.com/2c72d65c6c0fc08d068958290629b221/invoke.js';
      script.async = true;

      document.head.appendChild(script);
      console.log('🚀 Adsterra Social Bar Ad loaded on', currentDomain);

    } catch (error) {
      console.log('🚀 Adsterra Social Bar loading skipped (client-side only)');
    }
  }, [currentDomain]);

  return null; // Social Bar ads don't display visible content
};

// Smart Link Ad (simple, reliable)
export const SmartLinkAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const currentDomain = getAdDomain();

  if (currentDomain === 'localhost') {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-center ${className}`}>
        <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
        <div className="text-gray-600 text-xs">Smart Link Ad</div>
      </div>
    );
  }

  return (
    <motion.a
      href={`https://www.highperformanceformat.com/a8803f7b51b4e8b17f8e6be8c5f2c0d9/invoke.js`}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-gray-900 border border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800 transition-colors ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Sponsored</div>
      <div className="text-white text-sm font-medium">Discover More Tools</div>
    </motion.a>
  );
};

export default AdsterraAd;