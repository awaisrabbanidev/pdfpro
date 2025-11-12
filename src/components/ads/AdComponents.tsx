'use client';

import { useState, useEffect } from 'react';

// Ad Component Types
interface AdComponentProps {
  type: '300x250' | '728x90' | '160x600' | '160x300' | '468x60' | '320x50' | 'native' | 'social-bar' | 'popunder' | 'smartlink';
  className?: string;
  placeholder?: boolean;
}

// Exact AdsTerra Configuration from provided scripts
const AD_SCRIPTS = {
  '300x250': {
    key: 'ba27940e74baf283d86f8660cae41d24',
    width: 300,
    height: 250,
    format: 'iframe',
    params: {}
  },
  '728x90': {
    key: '8ec7631dfd51068968dbd73089bf3b26',
    width: 728,
    height: 90,
    format: 'iframe',
    params: {}
  },
  '160x600': {
    key: 'a384d2956c86a7fd01d08db11eb8584c',
    width: 160,
    height: 600,
    format: 'iframe',
    params: {}
  },
  '160x300': {
    key: 'df90677345a5b60bbb29cbe4970f2242',
    width: 160,
    height: 300,
    format: 'iframe',
    params: {}
  },
  '468x60': {
    key: '849d38461fd2bd641c5a7c889b44521d',
    width: 468,
    height: 60,
    format: 'iframe',
    params: {}
  },
  '320x50': {
    key: 'c4633a11d683cbe2bec94da10f617f82',
    width: 320,
    height: 50,
    format: 'iframe',
    params: {}
  }
};

// Exact AdsTerra script loading function
const loadAdScript = (adKey: string, adOptions: any) => {
  if (typeof window === 'undefined') return;

  try {
    // Set global atOptions exactly as AdsTerra expects
    (window as any).atOptions = adOptions;

    // Load the exact AdsTerra script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
    script.async = true;

    document.head.appendChild(script);

    console.log(`🚀 Loading AdsTerra ad: ${adKey} (${adOptions.width}x${adOptions.height})`);

  } catch (error) {
    console.log('❌ AdsTerra ad loading failed:', error);
  }
};

// Generic AdsTerra Ad Banner Component (EXACT IMPLEMENTATION)
const createAdBanner = (adType: keyof typeof AD_SCRIPTS) => {
  return ({ className = '', placeholder = false }: { className?: string; placeholder?: boolean }) => {
    const [adLoaded, setAdLoaded] = useState(false);

    useEffect(() => {
      if (placeholder || typeof window === 'undefined') return;

      // Use exact AdsTerra configuration
      const adOptions = AD_SCRIPTS[adType];

      const timer = setTimeout(() => {
        loadAdScript(adOptions.key, adOptions);
        setAdLoaded(true);
      }, 1000); // Load ads after 1 second

      return () => clearTimeout(timer);
    }, [placeholder, adType]);

    if (placeholder) {
      return (
        <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: `${AD_SCRIPTS[adType].width}px`, height: `${AD_SCRIPTS[adType].height}px`}}>
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
            <div className="text-gray-600 text-xs">{adType} banner</div>
          </div>
        </div>
      );
    }

    return (
      <div className={`ad-container-${adType} relative ${className}`} style={{width: `${AD_SCRIPTS[adType].width}px`, height: `${AD_SCRIPTS[adType].height}px`}}>
        {/* AdsTerra will inject iframe here */}
        {!adLoaded && (
          <div className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center z-10">
            <div className="text-gray-600 text-xs">Loading ad...</div>
          </div>
        )}
      </div>
    );
  };
};

// Create all ad banner components
export const AdBanner300x250 = createAdBanner('300x250');
export const AdBanner728x90 = createAdBanner('728x90');
export const AdBanner160x600 = createAdBanner('160x600');
export const AdBanner160x300 = createAdBanner('160x300');
export const AdBanner468x60 = createAdBanner('468x60');
export const AdBanner320x50 = createAdBanner('320x50');

// EXACT AdsTerra Native Banner Ad 4:1
export const NativeBannerAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        // Load exact AdsTerra Native Banner script
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = '//pl28033936.effectivegatecpm.com/538f84346f6d0f9234e5674bddfa9e4b/invoke.js';

        document.head.appendChild(script);
        setAdLoaded(true);

        console.log('🚀 Loading AdsTerra Native Banner 4:1');

      } catch (error) {
        console.log('❌ Native banner loading error:', error);
        setAdLoaded(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`native-banner-container ${className}`}>
      {/* Exact AdsTerra container for Native Banner 4:1 */}
      <div id="container-538f84346f6d0f9234e5674bddfa9e4b" className="min-h-[200px] flex items-center justify-center">
        {!adLoaded && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center w-full">
            <div className="text-gray-600 text-xs">Loading native ad...</div>
          </div>
        )}
      </div>
    </div>
  );
};

// EXACT AdsTerra PopUnder Ad
export const PopUnderAd: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        // Load exact AdsTerra PopUnder script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//pl28033939.effectivegatecpm.com/27/e0/0e/27e00e04b42fc26c73e3ad4be8bd85d8.js';
        document.body.appendChild(script);

        console.log('🚀 Loading AdsTerra PopUnder Ad');

      } catch (error) {
        console.log('❌ PopUnder ad loading error:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

// Social Bar Ad (client-side only)
export const SocialBarAd: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//pl28033957.effectivegatecpm.com/db/c0/8b/dbc08b2e31d941c4ee105765681dcac9.js';
        document.body.appendChild(script);
      } catch (error) {
        console.log('Social bar ad loading error:', error);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

// Smart Link Ad (simple, reliable)
export const SmartLinkAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`smartlink-container ${className}`}>
      <a
        href="https://www.effectivegatecpm.com/egdw906gqt?key=3165e0bbe3b19ccbb8cc20c32cda5301"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center py-3 px-6 rounded-lg transition-all duration-200 font-medium"
      >
        🎯 Special Offer - Boost Your PDF Workflow
      </a>
    </div>
  );
};