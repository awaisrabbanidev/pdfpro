import { PDF_TOOLS, SEO_CONFIG } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = SEO_CONFIG.url;
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0
    }
  ];

  // Tool pages
  const toolPages = PDF_TOOLS.map(tool => ({
    url: `${baseUrl}${tool.href}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));

  // Category pages
  const categoryPages = [
    'convert',
    'organize',
    'edit',
    'security',
    'advanced'
  ].map(category => ({
    url: `${baseUrl}/category/${category}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));

  const allPages = [...staticPages, ...toolPages, ...categoryPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}