import { Citation as CitationType } from '@/lib/types';
import { FileText, X } from 'lucide-react';
import { useState } from 'react';
import { escapeHtml } from '@/lib/utils';

interface CitationProps {
  citation: CitationType;
  isUserMessage?: boolean;
}

export default function Citation({ citation, isUserMessage = false }: CitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionNumber = citation.paragraphIndex + 1;
  const filename = citation.filename.replace('.md', '');

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="inline-block">
      <button
        onClick={handleClick}
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
          isUserMessage
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
        title={`Click to view source: ${citation.content}`}
      >
        <FileText className="h-3 w-3" />
        <span>{filename} §{sectionNumber}</span>
      </button>

      {isExpanded && (
        <div className={`mt-2 p-3 rounded-lg border shadow-lg max-w-md ${
          isUserMessage
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold">{filename} - Section {sectionNumber}</h4>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded-full hover:bg-opacity-20 ${
                isUserMessage ? 'hover:bg-white' : 'hover:bg-gray-100'
              }`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: escapeHtml(citation.content) }}></div>
        </div>
      )}
    </div>
  );
}