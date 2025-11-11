import Link from 'next/link';
import { motion } from 'framer-motion';
import { PDF_TOOLS, TOOL_CATEGORIES } from '@/lib/constants';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  return (
    <nav className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      <h3 className="text-white font-semibold mb-4">All PDF Tools</h3>

      {/* Category Navigation */}
      <div className="space-y-6">
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = PDF_TOOLS.filter(tool => tool.category === category.id);

          return (
            <div key={category.id}>
              <h4 className={`text-sm font-semibold mb-3 text-${category.color}-400`}>
                {category.title}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {categoryTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-all text-sm"
                  >
                    <span className="text-sm mr-2 group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </span>
                    <span className="truncate">{tool.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <h4 className="text-white font-semibold mb-3">Need Help?</h4>
        <div className="space-y-2">
          <Link
            href="/help"
            className="flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-all text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help Center
          </Link>
          <Link
            href="/tutorials"
            className="flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-all text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Video Tutorials
          </Link>
          <Link
            href="/api"
            className="flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-green-400 transition-all text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            API Documentation
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;