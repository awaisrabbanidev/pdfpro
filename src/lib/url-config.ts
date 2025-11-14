// Dynamic URL Configuration for Production Domains
export interface URLConfig {
  baseUrl: string;
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isVercelPreview: boolean;
  domain: string;
  canonicalDomain: string;
}

// Production domains configuration - UPDATED for Hostinger CNAME setup
const PRODUCTION_DOMAIN = 'pdfpro.pro'; // Primary domain
const WWW_DOMAIN = 'www.pdfpro.pro'; // Redirects to primary domain
const PRODUCTION_DOMAINS = [
  PRODUCTION_DOMAIN,
  WWW_DOMAIN
];

// Vercel preview domain patterns
const VERCEL_PATTERNS = [
  'vercel.app',
  'pdfpro.pro'
];

// Simple, reliable base URL function
export function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return "http://localhost:3000";
}

export function getURLConfig(): URLConfig {
  const baseUrl = getBaseUrl();
  const hostname = new URL(baseUrl).hostname;

  // Determine environment
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.') || hostname.includes('172.');
  const isProduction = PRODUCTION_DOMAINS.includes(hostname);
  const isVercelPreview = hostname.includes('vercel.app') && !isProduction;

  // Determine canonical domain (always use pdfpro.pro for production)
  const canonicalDomain = isProduction ? PRODUCTION_DOMAIN : hostname;

  console.log('🔧 URL Config Generated:', {
    hostname,
    isDevelopment,
    isProduction,
    isVercelPreview,
    canonicalDomain,
    baseUrl,
    apiBaseUrl: baseUrl,
    environment: typeof window === 'undefined' ? 'server' : 'client'
  });

  console.log('🔧 URL Config Generated:', {
    hostname,
    isDevelopment,
    isProduction,
    isVercelPreview,
    canonicalDomain,
    baseUrl,
    apiBaseUrl,
    environment: isServer ? 'server' : 'client',
    hostingerSetup: 'CNAME for pdfpro.pro + A record for Hostinger'
  });

  return {
    baseUrl,
    apiBaseUrl,
    isProduction,
    isDevelopment,
    isVercelPreview,
    domain: hostname,
    canonicalDomain
  };
}

// Helper function to get API endpoint URL
export function getApiUrl(path: string): string {
  const { apiBaseUrl } = getURLConfig();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${cleanPath}`;
}

// Helper function to get download URL
export function getDownloadUrl(filename: string): string {
  const { apiBaseUrl } = getURLConfig();
  return `${apiBaseUrl}/api/download/${filename}`;
}

// Helper function to get CDN URL for static assets
export function getCdnUrl(path: string): string {
  const { baseUrl } = getURLConfig();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Helper function to get canonical URL for SEO
export function getCanonicalUrl(path: string = ''): string {
  const { canonicalDomain } = getURLConfig();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${canonicalDomain}${cleanPath}`;
}

// Helper function to get domain for Adsterra configuration
export function getAdDomain(): string {
  const { isProduction, canonicalDomain } = getURLConfig();
  return isProduction ? canonicalDomain : 'localhost';
}

// Environment-aware console logging
export function logProductionInfo(message: string, data?: any) {
  const { isDevelopment } = getURLConfig();
  if (isDevelopment) {
    console.log(`🔍 ${message}`, data || '');
  }
}

// Domain validation for API requests
export function isValidProductionDomain(hostname: string): boolean {
  return PRODUCTION_DOMAINS.includes(hostname) || VERCEL_PATTERNS.some(pattern => hostname.includes(pattern));
}

// Helper function to check if current domain is the primary production domain
export function isPrimaryProductionDomain(): boolean {
  const { domain, canonicalDomain } = getURLConfig();
  return domain === canonicalDomain;
}