const requests = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
};

export function rateLimit(ip: string): { success: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;

  // Clean up old entries
  for (const [key, value] of requests.entries()) {
    if (value.resetTime < now) {
      requests.delete(key);
    }
  }

  // Get or create request record for this IP
  let record = requests.get(ip);
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + RATE_LIMIT.windowMs,
    };
    requests.set(ip, record);
  }

  // Check if over limit
  if (record.count >= RATE_LIMIT.maxRequests) {
    return {
      success: false,
      resetTime: record.resetTime,
      remaining: 0,
    };
  }

  // Increment counter
  record.count++;

  return {
    success: true,
    resetTime: record.resetTime,
    remaining: RATE_LIMIT.maxRequests - record.count,
  };
}

export function getClientIP(request: Request): string {
  // Try various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to a default (in production, this should be handled by the hosting platform)
  return 'unknown';
}