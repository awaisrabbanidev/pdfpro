<<<<<<< HEAD
export const runtime = 'nodejs';
=======
>>>>>>> compyle/pdfpro-runtime-config-deploy
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This feature is not yet implemented.' },
    { status: 501 }
  );
}
