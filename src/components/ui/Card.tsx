import React from 'react';
import { motion } from 'framer-motion';
import cn from 'classnames';

interface CardProps {
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  hover = false,
  glow = false,
  className,
  children
}) => {
  const baseClasses = 'bg-gray-900 border border-gray-800 rounded-xl p-6';
  const hoverClasses = hover ? 'card-hover cursor-pointer' : '';
  const glowClasses = glow ? 'glow-green' : '';

  const classes = cn(
    baseClasses,
    hoverClasses,
    glowClasses,
    className
  );

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;