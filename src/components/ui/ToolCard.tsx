import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import cn from 'classnames';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  className?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  href,
  color = 'green',
  className
}) => {
  const colorClasses = {
    green: 'text-green-500 hover:text-green-400',
    blue: 'text-blue-500 hover:text-blue-400',
    purple: 'text-purple-500 hover:text-purple-400',
    orange: 'text-orange-500 hover:text-orange-400',
    red: 'text-red-500 hover:text-red-400'
  };

  const cardContent = (
    <>
      <div className={cn('text-4xl mb-4', colorClasses[color])}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center text-green-500 text-sm font-medium">
        Use Tool
        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </>
  );

  return (
    <Card
      hover
      className={cn('group relative overflow-hidden', className)}
    >
      <motion.a
        href={href}
        className="block"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {cardContent}
      </motion.a>
    </Card>
  );
};

export default ToolCard;