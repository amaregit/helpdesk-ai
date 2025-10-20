import { Citation } from './types';

interface LLMResponse {
  content: string;
  citations: Citation[];
}

export class LLMService {
  private apiKey = process.env.OPENAI_API_KEY;
  private baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  async generateResponse(
    userMessage: string,
    context: Citation[],
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<LLMResponse> {
    // Mock implementation - replace with actual API call
    if (this.apiKey && this.apiKey !== 'your_openai_api_key_optional') {
      return this.callOpenAI(userMessage, context, messages);
    } else {
      return this.mockResponse(userMessage, context);
    }
  }

  async generateStreamingResponse(
    userMessage: string,
    context: Citation[],
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    // Mock streaming implementation - simulate token-by-token streaming
    if (this.apiKey && this.apiKey !== 'your_openai_api_key_optional') {
      return this.callOpenAIStreaming(userMessage, context, messages, onChunk);
    } else {
      return this.mockStreamingResponse(userMessage, context, onChunk);
    }
  }

  private async callOpenAI(
    userMessage: string,
    context: Citation[],
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<LLMResponse> {
    const systemPrompt = this.buildSystemPrompt(context);
    
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    // For streaming, we'll handle this differently in the API route
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      citations: context
    };
  }

  private mockResponse(userMessage: string, context: Citation[]): LLMResponse {
    // Simple mock that uses context to generate responses
    let response = "I'm not sure about that. Please check our documentation for more information.";
    
    if (context.length > 0) {
      const mainContext = context[0];
      if (mainContext.filename.includes('pricing')) {
        response = "Based on our pricing information, we offer several plans starting at $29/month. The Professional plan at $79/month includes priority support and advanced analytics.";
      } else if (mainContext.filename.includes('refund')) {
        response = "Our refund policy allows for 30-day money-back guarantees on new subscriptions. Refunds are not available for subscriptions older than 30 days.";
      } else if (mainContext.filename.includes('getting-started')) {
        response = "To get started, sign up for an account and generate your API key from the Settings page. Keep your API keys secure and use environment variables in production.";
      }
    }

    return {
      content: response,
      citations: context
    };
  }

  private async callOpenAIStreaming(
    userMessage: string,
    context: Citation[],
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: userMessage }
        ],
        stream: true,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    }

    return {
      content: fullContent,
      citations: context
    };
  }

  private async mockStreamingResponse(
    userMessage: string,
    context: Citation[],
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    // Simulate streaming by breaking response into chunks
    let response = "I'm not sure about that. Please check our documentation for more information.";

    if (context.length > 0) {
      const mainContext = context[0];
      if (mainContext.filename.includes('pricing')) {
        response = "Based on our pricing information, we offer several plans starting at $29/month. The Professional plan at $79/month includes priority support and advanced analytics.";
      } else if (mainContext.filename.includes('refund')) {
        response = "Our refund policy allows for 30-day money-back guarantees on new subscriptions. Refunds are not available for subscriptions older than 30 days.";
      } else if (mainContext.filename.includes('getting-started')) {
        response = "To get started, sign up for an account and generate your API key from the Settings page. Keep your API keys secure and use environment variables in production.";
      }
    }

    // Simulate streaming by sending chunks with delays
    const words = response.split(' ');
    let currentText = '';

    for (const word of words) {
      currentText += (currentText ? ' ' : '') + word;
      onChunk(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
    }

    return {
      content: response,
      citations: context
    };
  }

  private buildSystemPrompt(context: Citation[]): string {
    const contextText = context.map(citation =>
      `From ${citation.filename} (section ${citation.paragraphIndex + 1}):\n${citation.content}`
    ).join('\n\n');

    return `You are a helpful customer support assistant. Use the following context to answer the user's question. Be concise and helpful.

CONTEXT:
${contextText}

INSTRUCTIONS:
- Answer based only on the provided context
- If the answer isn't in the context, say "I don't have enough information to answer that question accurately. Please check our documentation or contact support."
- Cite your sources using the format [filename §section]
- Keep responses clear and professional
- If asking about pricing, be specific about plans and features
- For refund questions, mention the 30-day policy`;
  }
}

export const llmService = new LLMService();