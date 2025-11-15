import { IncomingForm } from 'formidable';
import { ensureTempDirs } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';

// Disable Next.js body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // Ensure directories exist before any file operations
  ensureTempDirs();

  const form = new IncomingForm({
    uploadDir: '/tmp/uploads',
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
  });

  return new Promise((resolve) => {
    form.parse(req as any, (err, fields, files) => {
      if (err) {
        console.error('form.parse error:', err);
        return resolve(
          NextResponse.json(
            { error: 'upload_parse_error', detail: err.message },
            { status: 500 }
          )
        );
      }

      try {
        // Handle both single and multiple files
        const savedFiles = Object.values(files)
          .flat()
          .map((file) => {
            if (!file) return null;
            return {
              filepath: (file as any).filepath || (file as any).path,
              originalFilename: (file as any).originalFilename || (file as any).name || null,
              size: (file as any).size || null,
            };
          })
          .filter(Boolean); // Remove null values

        console.log(`✅ Successfully uploaded ${savedFiles.length} files to /tmp/uploads`);

        return resolve(
          NextResponse.json(
            {
              ok: true,
              files: savedFiles,
              message: `Successfully uploaded ${savedFiles.length} file(s)`
            },
            { status: 200 }
          )
        );
      } catch (error) {
        console.error('File processing error:', error);
        return resolve(
          NextResponse.json(
            { error: 'file_processing_error', detail: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        );
      }
    });
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}