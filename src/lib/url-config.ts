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

export function getURLConfig(): URLConfig {
  // Check if we're in browser or server environment
  const isServer = typeof window === 'undefined';

  // For server-side rendering, get hostname from environment or default
  let hostname = '';
  let protocol = 'https:';
  let port = '';

  if (isServer) {
    // Server-side detection
    hostname = process.env.VERCEL_URL
      ? process.env.VERCEL_URL.replace(/^https?:\/\//, '')
      : process.env.VERCEL_DOMAIN || PRODUCTION_DOMAIN;

    protocol = process.env.VERCEL_ENV === 'development' ? 'http:' : 'https:';
  } else {
    // Client-side detection
    hostname = window.location.hostname;
    protocol = window.location.protocol;
    port = window.location.port ? `:${window.location.port}` : '';
  }

  // Determine environment
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.') || hostname.includes('172.');
  const isProduction = PRODUCTION_DOMAINS.includes(hostname);
  const isVercelPreview = VERCEL_PATTERNS.some(pattern => hostname.includes(pattern)) && !isProduction;

  // Determine canonical domain (always use pdfpro.pro for production)
  let canonicalDomain = hostname;
  if (isProduction || isVercelPreview) {
    canonicalDomain = PRODUCTION_DOMAIN; // Always use pdfpro.pro as canonical
  }

  // Construct base URLs
  let baseUrl: string;
  let apiBaseUrl: string;

  if (isDevelopment) {
    // Development environment
    const devPort = port || ':3000';
    baseUrl = `${protocol}//${hostname}${devPort}`;
    apiBaseUrl = `${protocol}//${hostname}${devPort}`;
  } else if (isProduction) {
    // Production environment - always use the current hostname
    baseUrl = `${protocol}//${hostname}`;
    apiBaseUrl = `${protocol}//${hostname}`;
  } else if (isVercelPreview) {
    // Vercel preview deployments
    baseUrl = `${protocol}//${hostname}`;
    apiBaseUrl = `${protocol}//${hostname}`;
  } else {
    // Fallback
    baseUrl = `${protocol}//${hostname}`;
    apiBaseUrl = `${protocol}//${hostname}`;
  }

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