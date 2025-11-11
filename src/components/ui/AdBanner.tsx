import React from 'react';
import { motion } from 'framer-motion';
import cn from 'classnames';

export interface AdSize {
  width: number;
  height: number;
}

export const AD_SIZES: Record<string, AdSize> = {
  '300x250': { width: 300, height: 250 },
  '728x90': { width: 728, height: 90 },
  '160x600': { width: 160, height: 600 },
  '160x300': { width: 160, height: 300 },
  '468x60': { width: 468, height: 60 },
  '320x50': { width: 320, height: 50 }
};

interface AdBannerProps {
  size: keyof typeof AD_SIZES;
  type: 'banner' | 'popunder' | 'smartlink' | 'social-bar' | 'native';
  slot?: string;
  className?: string;
  showPlaceholder?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({
  size,
  type,
  slot,
  className,
  showPlaceholder = true
}) => {
  const adSize = AD_SIZES[size];

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          'ad-placeholder',
          className
        )}
        style={{
          width: adSize.width,
          height: adSize.height
        }}
      >
        <div className="text-center p-4">
          <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">
            Advertisement
          </div>
          <div className="text-gray-600 text-xs">
            {size} {type}
          </div>
        </div>
      </div>
    );
  }

  // Actual ADSterra implementation would go here
  // This is a placeholder for the real ad code
  const adCode = `
    <script data-cfasync="false" type="text/javascript">
      (function(w, d) {
        var s = d.createElement('script');
        s.src = '//ads.terra.inc/deliver/ads.php?zone=${slot || ''}&size=${size}';
        s.async = true;
        (d.head || d.getElementsByTagName('head')[0]).appendChild(s);
      })(window, document);
    </script>
  `;

  return (
    <motion.div
      className={cn('relative', className)}
      style={{
        width: adSize.width,
        height: adSize.height
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: adCode }}
        className="ads-terra-container"
      />
      <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5">
        Ad
      </div>
    </motion.div>
  );
};

export default AdBanner;