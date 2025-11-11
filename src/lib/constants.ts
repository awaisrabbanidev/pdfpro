export interface PDFTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  category: 'convert' | 'organize' | 'edit' | 'security' | 'advanced';
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  keywords: string[];
}

export const PDF_TOOLS: PDFTool[] = [
  // Convert Tools
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert PDF documents to editable Microsoft Word (.docx) files while preserving formatting',
    icon: '📝',
    href: '/pdf-to-word',
    category: 'convert',
    color: 'green',
    keywords: ['pdf to word', 'pdf converter', 'document conversion']
  },
  {
    id: 'pdf-to-powerpoint',
    title: 'PDF to PowerPoint',
    description: 'Transform PDF files into editable PowerPoint presentations for easy editing',
    icon: '📊',
    href: '/pdf-to-powerpoint',
    category: 'convert',
    color: 'blue',
    keywords: ['pdf to ppt', 'pdf converter', 'presentation']
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Extract tables and data from PDFs into Excel spreadsheets with accurate formatting',
    icon: '📈',
    href: '/pdf-to-excel',
    category: 'convert',
    color: 'purple',
    keywords: ['pdf to excel', 'table extraction', 'data conversion']
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Microsoft Word documents to high-quality PDF files with layout preserved',
    icon: '📄',
    href: '/word-to-pdf',
    category: 'convert',
    color: 'orange',
    keywords: ['word to pdf', 'document conversion', 'office to pdf']
  },
  {
    id: 'powerpoint-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF format for easy sharing and printing',
    icon: '🎯',
    href: '/powerpoint-to-pdf',
    category: 'convert',
    color: 'red',
    keywords: ['ppt to pdf', 'presentation conversion', 'office to pdf']
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF while maintaining tables and formatting',
    icon: '📉',
    href: '/excel-to-pdf',
    category: 'convert',
    color: 'green',
    keywords: ['excel to pdf', 'spreadsheet conversion', 'office to pdf']
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Convert PDF pages to high-quality JPEG images for easy sharing and editing',
    icon: '🖼️',
    href: '/pdf-to-jpg',
    category: 'convert',
    color: 'blue',
    keywords: ['pdf to image', 'pdf converter', 'image extraction']
  },
  {
    id: 'jpg-to-pdf',
    title: 'JPG to PDF',
    description: 'Combine multiple JPG images into a single PDF document or create photo albums',
    icon: '📷',
    href: '/jpg-to-pdf',
    category: 'convert',
    color: 'purple',
    keywords: ['image to pdf', 'photo conversion', 'jpg converter']
  },
  {
    id: 'html-to-pdf',
    title: 'HTML to PDF',
    description: 'Convert web pages and HTML files to PDF format with perfect formatting',
    icon: '🌐',
    href: '/html-to-pdf',
    category: 'convert',
    color: 'orange',
    keywords: ['html converter', 'web to pdf', 'page conversion']
  },
  {
    id: 'scan-to-pdf',
    title: 'Scan to PDF',
    description: 'Convert scanned documents to searchable PDF files with OCR technology',
    icon: '📠',
    href: '/scan-to-pdf',
    category: 'convert',
    color: 'red',
    keywords: ['scan converter', 'ocr', 'document digitization']
  },

  // Organize Tools
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document with custom ordering',
    icon: '🔗',
    href: '/merge-pdf',
    category: 'organize',
    color: 'green',
    keywords: ['pdf merger', 'combine pdfs', 'join pdfs']
  },
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description: 'Extract pages from PDF files or split documents into multiple files',
    icon: '✂️',
    href: '/split-pdf',
    category: 'organize',
    color: 'blue',
    keywords: ['pdf splitter', 'extract pages', 'separate pdfs']
  },
  {
    id: 'organize-pdf',
    title: 'Organize PDF',
    description: 'Rearrange, add, remove, and rotate pages in PDF documents',
    icon: '📚',
    href: '/organize-pdf',
    category: 'organize',
    color: 'purple',
    keywords: ['organize pages', 'reorder pdf', 'page management']
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    description: 'Rotate PDF pages by 90°, 180°, or 270° degrees for correct orientation',
    icon: '🔄',
    href: '/rotate-pdf',
    category: 'organize',
    color: 'orange',
    keywords: ['rotate pages', 'page orientation', 'pdf rotation']
  },
  {
    id: 'crop-pdf',
    title: 'Crop PDF',
    description: 'Trim and crop PDF pages to focus on important content or remove margins',
    icon: '✂️',
    href: '/crop-pdf',
    category: 'organize',
    color: 'red',
    keywords: ['crop pages', 'trim pdf', 'page cropping']
  },
  {
    id: 'page-numbers',
    title: 'Page Numbers',
    description: 'Add custom page numbers to PDF documents with various formatting options',
    icon: '🔢',
    href: '/page-numbers',
    category: 'organize',
    color: 'green',
    keywords: ['add page numbers', 'number pages', 'pdf numbering']
  },

  // Edit Tools
  {
    id: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Edit text, images, and content in PDF documents with powerful tools',
    icon: '✏️',
    href: '/edit-pdf',
    category: 'edit',
    color: 'blue',
    keywords: ['pdf editor', 'edit documents', 'modify pdfs']
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality for easy sharing and storage',
    icon: '🗜️',
    href: '/compress-pdf',
    category: 'edit',
    color: 'purple',
    keywords: ['compress pdf', 'reduce size', 'optimize pdf']
  },
  {
    id: 'repair-pdf',
    title: 'Repair PDF',
    description: 'Fix corrupted or damaged PDF files and recover their content',
    icon: '🔧',
    href: '/repair-pdf',
    category: 'edit',
    color: 'orange',
    keywords: ['repair pdf', 'fix corrupted', 'recover pdf']
  },

  // Security Tools
  {
    id: 'sign-pdf',
    title: 'Sign PDF',
    description: 'Add digital signatures to PDF documents for authentication and approval',
    icon: '✍️',
    href: '/sign-pdf',
    category: 'security',
    color: 'red',
    keywords: ['digital signature', 'sign document', 'pdf signing']
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Add password protection and encryption to secure sensitive PDF documents',
    icon: '🔒',
    href: '/protect-pdf',
    category: 'security',
    color: 'green',
    keywords: ['password protect', 'encrypt pdf', 'secure document']
  },
  {
    id: 'unlock-pdf',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDF files with valid credentials',
    icon: '🔓',
    href: '/unlock-pdf',
    category: 'security',
    color: 'blue',
    keywords: ['remove password', 'unlock pdf', 'decrypt document']
  },
  {
    id: 'watermark',
    title: 'Watermark',
    description: 'Add text or image watermarks to PDF pages for branding and protection',
    icon: '💧',
    href: '/watermark',
    category: 'security',
    color: 'purple',
    keywords: ['add watermark', 'protect pdf', 'brand documents']
  },
  {
    id: 'redact-pdf',
    title: 'Redact PDF',
    description: 'Permanently black out sensitive information and confidential data in PDFs',
    icon: '⬛',
    href: '/redact-pdf',
    category: 'security',
    color: 'orange',
    keywords: ['redact text', 'hide information', 'confidential pdf']
  },

  // Advanced Tools
  {
    id: 'ocr-pdf',
    title: 'OCR PDF',
    description: 'Extract text from scanned PDFs using Optical Character Recognition technology',
    icon: '🔍',
    href: '/ocr-pdf',
    category: 'advanced',
    color: 'red',
    keywords: ['ocr', 'text extraction', 'scanned pdf']
  },
  {
    id: 'compare-pdf',
    title: 'Compare PDF',
    description: 'Compare two PDF documents and highlight differences between them',
    icon: '⚖️',
    href: '/compare-pdf',
    category: 'advanced',
    color: 'green',
    keywords: ['compare documents', 'diff pdf', 'document comparison']
  },
  {
    id: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    description: 'Convert PDF documents to PDF/A format for long-term archival storage',
    icon: '📋',
    href: '/pdf-to-pdfa',
    category: 'advanced',
    color: 'blue',
    keywords: ['pdfa conversion', 'archival pdf', 'long-term storage']
  }
];

export const TOOL_CATEGORIES = [
  {
    id: 'convert',
    title: 'Convert',
    description: 'Convert PDFs to and from various formats',
    color: 'green'
  },
  {
    id: 'organize',
    title: 'Organize',
    description: 'Manage pages and structure of PDF documents',
    color: 'blue'
  },
  {
    id: 'edit',
    title: 'Edit',
    description: 'Modify and optimize PDF content',
    color: 'purple'
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Protect and secure PDF documents',
    color: 'orange'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Professional PDF tools and utilities',
    color: 'red'
  }
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/html'
];

export const SEO_CONFIG = {
  siteName: 'PDFPro.pro',
  title: 'PDFPro.pro - Free Online PDF Tools | Merge, Split, Convert & Edit PDFs',
  description: 'Professional PDF tools online. Merge, split, compress, convert PDF to Word, Excel, PowerPoint. Edit, sign, watermark PDFs. Free, secure, no registration required.',
  keywords: 'PDF tools, merge PDF, split PDF, compress PDF, PDF converter, edit PDF, sign PDF, PDF to Word, PDF to Excel, free PDF tools',
  ogImage: '/og-image.jpg',
  url: 'https://pdfpro.pro'
};