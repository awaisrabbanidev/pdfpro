'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AdBanner from '../ui/AdBanner';
import { PDF_TOOLS } from '@/lib/constants';

interface SidebarProps {
  showAds?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ showAds = true }) => {
  const recentTools = PDF_TOOLS.slice(0, 8);

  return (
    <aside className="w-full lg:w-64 space-y-6">
      {/* Top Ad */}
      {showAds && (
        <div className="hidden lg:block">
          <AdBanner
            size="160x600"
            type="banner"
            showPlaceholder={true}
          />
        </div>
      )}

      {/* Recent Tools */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Popular Tools
        </h3>
        <ul className="space-y-2">
          {recentTools.map((tool) => (
            <li key={tool.id}>
              <Link
                href={tool.href}
                className="group flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-all"
              >
                <span className="text-lg mr-3 group-hover:scale-110 transition-transform">
                  {tool.icon}
                </span>
                <span className="text-sm">{tool.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Middle Ad */}
      {showAds && (
        <div className="hidden lg:block">
          <AdBanner
            size="160x300"
            type="banner"
            showPlaceholder={true}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Site Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total Tools</span>
            <span className="text-green-400 font-semibold">{PDF_TOOLS.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Files Processed</span>
            <span className="text-green-400 font-semibold">10M+</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Happy Users</span>
            <span className="text-green-400 font-semibold">5M+</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Uptime</span>
            <span className="text-green-400 font-semibold">99.9%</span>
          </div>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">✨ Premium Features</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start">
            <span className="text-green-400 mr-2 mt-0.5">✓</span>
            <span>Unlimited file size</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2 mt-0.5">✓</span>
            <span>Batch processing</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2 mt-0.5">✓</span>
            <span>Advanced AI features</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2 mt-0.5">✓</span>
            <span>Priority support</span>
          </li>
        </ul>
        <button className="mt-4 w-full bg-green-500 hover:bg-green-600 text-black font-medium py-2 px-4 rounded-lg transition-colors text-sm">
          Upgrade Now
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;