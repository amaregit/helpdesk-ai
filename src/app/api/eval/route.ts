import { NextRequest } from 'next/server';
import { retriever } from '@/lib/retriever';
import { EvalResult } from '@/lib/types';

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

const TEST_QUESTIONS = [
  {
    question: "What are the pricing tiers and what's included?",
    expectedSources: ['pricing.md']
  },
  {
    question: "How do I get an API key to start?",
    expectedSources: ['getting-started.md']
  },
  {
    question: "Can I get a refund after 20 days?",
    expectedSources: ['refunds.md']
  },
  {
    question: "Do you ship hardware devices?",
    expectedSources: [] // Should return no sources or refuse
  }
];

export async function GET(request: NextRequest) {
  if (!authenticate(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const results: EvalResult[] = [];

    for (const test of TEST_QUESTIONS) {
      const citations = retriever.getRelevantChunks(test.question);
      const actualSources = [...new Set(citations.map(c => c.filename))];
      
      const passed = test.expectedSources.length === 0 
        ? citations.length === 0 // Expect no sources for out-of-scope questions
        : test.expectedSources.every(src => actualSources.includes(src));

      results.push({
        question: test.question,
        expectedSources: test.expectedSources,
        actualSources,
        passed
      });
    }

    const summary = {
      totalTests: results.length,
      passedTests: results.filter(r => r.passed).length,
      results
    };

    return Response.json(summary);
  } catch (error) {
    console.error('Eval API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}