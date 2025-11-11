# PDFPro.pro - Professional PDF Tools

A comprehensive PDF processing website with 27 professional PDF tools, built with Next.js and featuring a modern black/green GitHub-inspired design.

## 🚀 Live Demo

Visit **[https://awaisrabbanidev.github.io/pdfpro/](https://awaisrabbanidev.github.io/pdfpro/)** to see the static demo.

## 📋 Features

### Core PDF Operations
- **Merge PDF** - Combine multiple PDFs into one document
- **Split PDF** - Extract pages or split into multiple files
- **Compress PDF** - Reduce file size with multiple quality levels
- **Convert PDF** - To/From Word, Excel, PowerPoint, Images
- **Edit PDF** - Text editing, annotations, and modifications
- **Sign PDF** - Add digital signatures
- **OCR PDF** - Extract text from scanned documents
- **Crop PDF** - Remove margins and unwanted content
- **Compare PDF** - Compare two documents with detailed reports

### Advanced Tools
- **Organize PDF** - Reorder pages and manage structure
- **Rotate PDF** - Adjust page orientations
- **Watermark** - Add text or image watermarks
- **Page Numbers** - Add automatic page numbering
- **Redact PDF** - Black out sensitive information
- **Repair PDF** - Fix corrupted files
- **Protect/Unlock PDF** - Password protection and removal
- **Scan to PDF** - Convert scanned documents
- **HTML to PDF** - Convert web pages to PDF

## 🎨 Design Features

- **GitHub-Inspired Theme** - Professional black/green color scheme
- **Responsive Design** - Works perfectly on all devices
- **Modern UI** - Smooth animations and interactions
- **Category Filtering** - Easy tool organization
- **Progress Indicators** - Real-time processing feedback
- **Drag & Drop** - Intuitive file uploads

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **PDF Processing**: PDF-lib, Mammoth
- **File Handling**: React-dropzone
- **Animations**: Framer Motion
- **State Management**: Zustand

## 📁 Project Structure

```
pdfpro/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/pdf/        # PDF processing API routes
│   │   ├── [tool]/         # Dynamic tool pages
│   │   └── globals.css     # Black/green theme styles
│   ├── components/         # React components
│   │   ├── layout/         # Header, Footer, Navigation
│   │   ├── tools/          # Tool-specific components
│   │   └── ui/             # Reusable UI components
│   └── lib/                # Utilities and constants
├── index.html              # Static demo for GitHub Pages
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Getting Started

### Static Demo (GitHub Pages)
The static demo is already deployed and available at the GitHub Pages link above.

### Full Development Version
```bash
# Clone the repository
git clone https://github.com/awaisrabbanidev/pdfpro.git
cd pdfpro

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📝 API Endpoints

The full application includes these API endpoints (server deployment required):

- `POST /api/pdf/merge` - Merge PDF files
- `POST /api/pdf/split` - Split PDF documents
- `POST /api/pdf/compress` - Compress PDFs
- `POST /api/pdf/pdf-to-word` - Convert PDF to Word
- `POST /api/pdf/word-to-pdf` - Convert Word to PDF
- `POST /api/pdf/ocr` - Extract text using OCR
- `POST /api/pdf/crop` - Crop PDF pages
- `POST /api/pdf/compare` - Compare PDFs
- `GET /api/download/[filename]` - File downloads

## 🔒 Features

- **Security**: File validation and sanitization
- **Privacy**: Automatic file deletion after 2 hours
- **Performance**: Optimized processing with progress tracking
- **Error Handling**: Comprehensive error management
- **SEO**: Optimized meta tags and structured data

## 🌟 Demo Notes

- The GitHub Pages version is a **static demo** showcasing the UI and design
- Full PDF processing functionality requires server deployment
- All 27 tools are represented with proper categorization
- Interactive demo shows tool information and capabilities

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Next.js, React, and modern web technologies**
