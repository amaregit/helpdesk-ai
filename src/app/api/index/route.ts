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
    const success = retriever.reindex();
    const status = retriever.getIndexStatus();

    return Response.json({
      success,
      ...status
    });
  } catch (error) {
    console.error('Index API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  try {
    const status = retriever.getIndexStatus();
    return Response.json(status);
  } catch (error) {
    console.error('Index status API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}