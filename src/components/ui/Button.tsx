import React from 'react';
import { motion } from 'framer-motion';
import cn from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-green-500 text-black hover:bg-green-600 border border-green-500',
    secondary: 'bg-gray-800 text-gray-100 hover:bg-gray-700 border border-gray-700',
    outline: 'bg-transparent text-green-500 hover:bg-green-500 hover:text-black border border-green-500',
    ghost: 'bg-transparent text-gray-300 hover:text-green-500 hover:bg-gray-900'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    glow && 'glow-green',
    className
  );

  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      whileHover={{ scale: loading || disabled ? 1 : 1.02 }}
      whileTap={{ scale: loading || disabled ? 1 : 0.98 }}
      {...props}
    >
      {loading && (
        <div className="loading-spinner mr-2" />
      )}
      {children}
    </motion.button>
  );
};

export default Button;