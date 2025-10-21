'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [placeholder, setPlaceholder] = useState('Type your question... (Enter to send)');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && typeof window !== 'undefined') {
      textareaRef.current.style.height = 'auto';
      if (message.trim()) {
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.min(scrollHeight, 120);
        textareaRef.current.style.height = `${newHeight}px`;
        if (scrollHeight > 120) {
          textareaRef.current.style.overflow = 'auto';
          textareaRef.current.style.paddingRight = '56px'; // 48px + 8px for scrollbar
        } else {
          textareaRef.current.style.overflow = 'hidden';
          textareaRef.current.style.paddingRight = '48px';
        }
      } else {
        textareaRef.current.style.height = '48px';
        textareaRef.current.style.overflow = 'hidden';
        textareaRef.current.style.paddingRight = '48px';
      }
    }
  }, [message]);

  useEffect(() => {
    const updatePlaceholder = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        setPlaceholder(isMobile ? 'Ask a question...' : 'Type your question... (Enter to send)');
      }
    };

    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);
    return () => window.removeEventListener('resize', updatePlaceholder);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current && typeof window !== 'undefined') {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <style jsx>{`
        textarea::-webkit-scrollbar {
          width: 8px;
        }
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-2 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
          style={{ minHeight: '48px', maxHeight: '120px' }}
          suppressHydrationWarning={true}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white bg-blue-500 rounded-xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}