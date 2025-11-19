import { MetadataRoute } from 'next';
import { PDF_TOOLS, SEO_CONFIG } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SEO_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SEO_CONFIG.url}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SEO_CONFIG.url}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = PDF_TOOLS.map((tool) => ({
    url: `${SEO_CONFIG.url}${tool.href}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...toolRoutes];
}
