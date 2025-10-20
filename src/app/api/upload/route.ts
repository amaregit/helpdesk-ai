import { NextRequest } from 'next/server';
import { retriever } from '@/lib/retriever';
import fs from 'fs';
import path from 'path';

// Simple authentication - in production, use proper auth
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function authenticate(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!authenticate(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dataDir = path.join(process.cwd(), 'src/data');
    const uploadedFiles: string[] = [];

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save each file
    for (const file of files) {
      if (!file.name.endsWith('.md')) {
        continue; // Only accept markdown files
      }

      const filePath = path.join(dataDir, file.name);
      const content = await file.text();

      fs.writeFileSync(filePath, content);
      uploadedFiles.push(file.name);
    }

    // Reindex documents
    const success = retriever.reindex();

    return Response.json({
      success,
      message: `Uploaded ${uploadedFiles.length} files and reindexed documents`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}