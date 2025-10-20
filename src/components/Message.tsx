import { Message as MessageType } from '@/lib/types';
import Citation from './Citation';
import { User, Bot } from 'lucide-react';
import { escapeHtml } from '@/lib/utils';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} space-x-3`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div
        className={`rounded-2xl p-4 max-w-[85%] ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: escapeHtml(message.content) }}></div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-opacity-20 border-current">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-xs font-medium ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                Sources:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, index) => (
                <Citation key={index} citation={citation} isUserMessage={isUser} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-3 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}