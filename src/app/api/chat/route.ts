import { NextRequest } from 'next/server';
import { retriever } from '@/lib/retriever';
import { llmService } from '@/lib/llm';
import { monitoring } from '@/lib/monitoring';
import { ChatRequest } from '@/lib/types';

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    if (!checkRateLimit(clientIP)) {
      monitoring.trackRequest('', Date.now() - startTime, [], true);
      return new Response('Rate limit exceeded. Please try again later.', { status: 429 });
    }

    const body: ChatRequest = await request.json();
    const { messages } = body;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      monitoring.trackRequest(lastMessage.content, Date.now() - startTime, [], true);
      return new Response('Last message must be from user', { status: 400 });
    }

    // Retrieve relevant context
    const context = retriever.getRelevantChunks(lastMessage.content);

    // Set up Server-Sent Events for streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(encoder.encode('data: {"type": "start"}\n\n'));

          // Generate streaming response
          const response = await llmService.generateStreamingResponse(
            lastMessage.content,
            context,
            messages.slice(0, -1), // previous messages for context
            (chunk: string) => {
              // Send each chunk as it arrives
              const data = JSON.stringify({
                type: 'chunk',
                content: chunk
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          );

          // Send final message with citations
          const finalData = JSON.stringify({
            type: 'end',
            content: response.content,
            citations: response.citations
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

          // Track successful request
          monitoring.trackRequest(lastMessage.content, Date.now() - startTime, response.citations, false);

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            message: 'An error occurred while generating the response.'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));

          // Track error
          monitoring.trackRequest(lastMessage.content, Date.now() - startTime, context, true);

          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    monitoring.trackRequest('', Date.now() - startTime, [], true);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export function GET() {
  return new Response('Method not allowed', { status: 405 });
}