'use client';

import { useState, useEffect } from 'react';

// Ad Component Types
interface AdComponentProps {
  type: '300x250' | '728x90' | '160x600' | '160x300' | '468x60' | '320x50' | 'native' | 'social-bar' | 'popunder' | 'smartlink';
  className?: string;
  placeholder?: boolean;
}

// Individual Ad Scripts Configuration
const AD_SCRIPTS = {
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
  }
};

// Utility function to load ads safely
const loadAdScript = (adKey: string, adOptions: any, containerId?: string) => {
  if (typeof window === 'undefined') return;

  try {
    // Set global ad options
    (window as any).atOptions = {
      ...adOptions,
      container: containerId ? `#${containerId}` : undefined
    };

    // Load ad script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
    script.async = true;

    if (containerId) {
      // For specific container targeting
      script.setAttribute('data-ad-container', containerId);
    }

    document.head.appendChild(script);

    // Set a timeout to consider ad as "loaded" even if script doesn't callback
    setTimeout(() => {
      console.log(`Ad script loaded for ${adKey}`);
    }, 2000);

  } catch (error) {
    console.log('Ad loading failed:', error);
  }
};

// Create a safe Ad Banner component
export const AdBanner300x250: React.FC<{ className?: string; placeholder?: boolean }> = ({
  className = '',
  placeholder = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adId] = useState(() => `ad-300x250-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (placeholder || typeof window === 'undefined') return;

    const adOptions = {
      key: AD_SCRIPTS['300x250'].key,
      format: AD_SCRIPTS['300x250'].format,
      height: AD_SCRIPTS['300x250'].height,
      width: AD_SCRIPTS['300x250'].width,
      params: {}
    };

    // Delay ad loading to prevent SSR issues
    const timer = setTimeout(() => {
      loadAdScript(AD_SCRIPTS['300x250'].key, adOptions, adId);
      setAdLoaded(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [placeholder, adId]);

  if (placeholder) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: '300px', height: '250px'}}>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">300x250 banner</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-300x250 relative ${className}`} style={{width: '300px', height: '250px'}}>
      <div id={adId} style={{width: '100%', height: '100%'}} />
      {!adLoaded && (
        <div className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-gray-600 text-xs">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

export const AdBanner728x90: React.FC<{ className?: string; placeholder?: boolean }> = ({
  className = '',
  placeholder = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (placeholder || typeof window === 'undefined') return;

    const adOptions = {
      key: AD_SCRIPTS['728x90'].key,
      format: AD_SCRIPTS['728x90'].format,
      height: AD_SCRIPTS['728x90'].height,
      width: AD_SCRIPTS['728x90'].width,
      params: {}
    };

    const timer = setTimeout(() => {
      loadAdScript(AD_SCRIPTS['728x90'].key, adOptions);
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [placeholder]);

  if (placeholder) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: '728px', height: '90px'}}>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">728x90 banner</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-728x90 ${className}`} style={{width: '728px', height: '90px'}}>
      {!adLoaded && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center h-full">
          <div className="text-gray-600 text-xs">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

export const AdBanner160x600: React.FC<{ className?: string; placeholder?: boolean }> = ({
  className = '',
  placeholder = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (placeholder || typeof window === 'undefined') return;

    const adOptions = {
      key: AD_SCRIPTS['160x600'].key,
      format: AD_SCRIPTS['160x600'].format,
      height: AD_SCRIPTS['160x600'].height,
      width: AD_SCRIPTS['160x600'].width,
      params: {}
    };

    const timer = setTimeout(() => {
      loadAdScript(AD_SCRIPTS['160x600'].key, adOptions);
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [placeholder]);

  if (placeholder) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: '160px', height: '600px'}}>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">160x600 banner</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-160x600 ${className}`} style={{width: '160px', height: '600px'}}>
      {!adLoaded && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center h-full">
          <div className="text-gray-600 text-xs">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

export const AdBanner160x300: React.FC<{ className?: string; placeholder?: boolean }> = ({
  className = '',
  placeholder = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (placeholder || typeof window === 'undefined') return;

    const adOptions = {
      key: AD_SCRIPTS['160x300'].key,
      format: AD_SCRIPTS['160x300'].format,
      height: AD_SCRIPTS['160x300'].height,
      width: AD_SCRIPTS['160x300'].width,
      params: {}
    };

    const timer = setTimeout(() => {
      loadAdScript(AD_SCRIPTS['160x300'].key, adOptions);
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [placeholder]);

  if (placeholder) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: '160px', height: '300px'}}>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">160x300 banner</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-160x300 ${className}`} style={{width: '160px', height: '300px'}}>
      {!adLoaded && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center h-full">
          <div className="text-gray-600 text-xs">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

export const AdBanner468x60: React.FC<{ className?: string; placeholder?: boolean }> = ({
  className = '',
  placeholder = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (placeholder || typeof window === 'undefined') return;

    const adOptions = {
      key: AD_SCRIPTS['468x60'].key,
      format: AD_SCRIPTS['468x60'].format,
      height: AD_SCRIPTS['468x60'].height,
      width: AD_SCRIPTS['468x60'].width,
      params: {}
    };

    const timer = setTimeout(() => {
      loadAdScript(AD_SCRIPTS['468x60'].key, adOptions);
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [placeholder]);

  if (placeholder) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: '468px', height: '60px'}}>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">468x60 banner</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-468x60 ${className}`} style={{width: '468px', height: '60px'}}>
      {!adLoaded && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center h-full">
          <div className="text-gray-600 text-xs">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

export const AdBanner320x50: React.FC<{ className?: string; placeholder?: boolean }> = ({
  className = '',
  placeholder = false
}) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (placeholder || typeof window === 'undefined') return;

    const adOptions = {
      key: AD_SCRIPTS['320x50'].key,
      format: AD_SCRIPTS['320x50'].format,
      height: AD_SCRIPTS['320x50'].height,
      width: AD_SCRIPTS['320x50'].width,
      params: {}
    };

    const timer = setTimeout(() => {
      loadAdScript(AD_SCRIPTS['320x50'].key, adOptions);
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [placeholder]);

  if (placeholder) {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-center p-4 ${className}`} style={{width: '320px', height: '50px'}}>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">Advertisement</div>
          <div className="text-gray-600 text-xs">320x50 banner</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container-320x50 ${className}`} style={{width: '320px', height: '50px'}}>
      {!adLoaded && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center h-full">
          <div className="text-gray-600 text-xs">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

// Native Banner Ad (more reliable)
export const NativeBannerAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        // Create container for native ad
        const container = document.getElementById('container-538f84346f6d0f9234e5674bddfa9e4b');
        if (container) {
          const script = document.createElement('script');
          script.async = true;
          script.setAttribute('data-cfasync', 'false');
          script.src = '//pl28033936.effectivegatecpm.com/538f84346f6d0f9234e5674bddfa9e4b/invoke.js';
          container.appendChild(script);
        }
        setAdLoaded(true);
      } catch (error) {
        console.log('Native ad loading error:', error);
        setAdLoaded(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`native-banner-container ${className}`}>
      <div id="container-538f84346f6d0f9234e5674bddfa9e4b">
        {!adLoaded && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-gray-600 text-xs">Loading native ad...</div>
          </div>
        )}
      </div>
    </div>
  );
};

// PopUnder Ad (client-side only)
export const PopUnderAd: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//pl28033939.effectivegatecpm.com/27/e0/0e/27e00e04b42fc26c73e3ad4be8bd85d8.js';
        document.body.appendChild(script);
      } catch (error) {
        console.log('PopUnder ad loading error:', error);
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