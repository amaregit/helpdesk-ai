'use client';

import { useState, useRef, useEffect } from 'react';
import { Message as MessageType, Citation } from '@/lib/types';
import Message from './Message';
import ChatInput from './ChatInput';
import { Bot, MessageSquare, MessageCircle } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create streaming assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: MessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let citations: Citation[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim() === '') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'chunk') {
                  fullContent += parsed.content;
                  // Update the message content in real-time
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  ));
                } else if (parsed.type === 'end') {
                  citations = parsed.citations || [];
                  fullContent = parsed.content;
                  // Final update with complete content and citations
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent, citations }
                      : msg
                  ));
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: MessageType = {
        id: assistantMessageId,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId ? errorMessage : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex max-w-6xl  flex-col h-full w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold truncate">HelpDesk Assistant</h1>
              <p className="text-blue-100 text-xs sm:text-sm truncate">Powered by AI + RAG</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            <div className="text-xs sm:text-sm bg-white/20 px-2 sm:px-3 py-1 rounded-full flex items-center space-x-1">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{messages.length} messages</span>
              <span className="sm:hidden">{messages.length}</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs sm:text-sm bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-full transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto w-full">
        <div className="max-w-6xl mx-auto w-full space-y-6">

          {messages.length === 0 && (
            <div className="h-full flex flex-col justify-center w-full max-w-6xl px-6">
              <div className="w-full max-w-6xl mx-auto text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-4 inline-block">
                  <MessageSquare className="h-12 w-12 text-blue-500" />
                </div>

                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  Welcome to HelpDesk AI
                </h2>
                <p className="text-gray-600 mb-6">
                  I can help you find information about pricing, refunds, and getting started.
                  Ask me anything!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => handleSendMessage("What are the pricing tiers and what’s included?")}
                    className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors w-full"
                  >
                    <div className="font-medium text-gray-800">💰 Pricing</div>
                    <div className="text-sm text-gray-600">Learn about our plans</div>
                  </button>

                  <button
                    onClick={() => handleSendMessage("How do I get an API key?")}
                    className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors w-full"
                  >
                    <div className="font-medium text-gray-800">🚀 Get Started</div>
                    <div className="text-sm text-gray-600">API key setup</div>
                  </button>

                  <button
                    onClick={() => handleSendMessage("What's the refund policy?")}
                    className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors w-full"
                  >
                    <div className="font-medium text-gray-800">↩️ Refunds</div>
                    <div className="text-sm text-gray-600">30-day guarantee</div>
                  </button>

                  <button
                    onClick={() => handleSendMessage("Do you offer phone support?")}
                    className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors w-full"
                  >
                    <div className="font-medium text-gray-800">📞 Support</div>
                    <div className="text-sm text-gray-600">Contact options</div>
                  </button>
                </div>
              </div>
            </div>

          )}

          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
        </div>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        <div className="text-xs text-gray-500 text-center mt-3">
          Ask about pricing, refunds, or getting started. I&apos;ll find the right information for you.
        </div>
      </div>
    </div>
  );
}