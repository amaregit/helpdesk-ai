import { Retriever } from '@/lib/retriever';

// Mock document data for testing
const mockDocuments = [
  {
    filename: 'pricing.md',
    content: `# Pricing Information

## Pricing Tiers

We offer three main pricing tiers.

Starter Plan - $29/month
- Includes 1,000 API requests
- Basic support

Professional Plan - $79/month  
- Includes 10,000 API requests
- Priority support`
  },
  {
    filename: 'refunds.md',
    content: `# Refund Policy

## Refund Eligibility

We offer 30-day money-back guarantee for all new subscriptions.

Refund requests must be made within 30 days of initial purchase.`
  }
];

describe('Retriever', () => {
  let retriever: Retriever;

  beforeEach(() => {
    // Create a new retriever instance for each test
    retriever = new Retriever();
    
    // Manually load mock documents since we can't access actual files in tests
    retriever['chunks'] = [];
    mockDocuments.forEach(doc => {
      retriever['chunks'].push(...retriever['splitDocument'](doc.content, doc.filename));
    });
    retriever['isIndexed'] = true;
  });

  describe('splitDocument', () => {
    it('should split document into chunks by paragraphs', () => {
      const content = `First paragraph.

Second paragraph with more content that exceeds the minimum length requirement for inclusion.

Third paragraph.`;

      const chunks = retriever['splitDocument'](content, 'test.md');

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('First paragraph.');
      expect(chunks[1].content).toBe('Second paragraph with more content that exceeds the minimum length requirement for inclusion.');
      expect(chunks[2].content).toBe('Third paragraph.');
    });

    it('should filter out very short paragraphs but keep headings', () => {
      const content = `Short.

This is a much longer paragraph that should be included because it has sufficient content to be meaningful for retrieval purposes and exceeds thirty characters.

# Heading that should be filtered out

Another good paragraph.`;

      const chunks = retriever['splitDocument'](content, 'test.md');

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toContain('much longer paragraph');
      expect(chunks[1].content).toBe('# Heading that should be filtered out');
      expect(chunks[2].content).toBe('Another good paragraph.');
    });
  });

  describe('bm25Score', () => {
    it('should score documents with matching terms higher', () => {
      const chunk = {
        id: 'test-1',
        filename: 'test.md',
        content: 'This is a document about pricing and refund policies',
        paragraphIndex: 0
      };

      const score1 = retriever['bm25Score']('pricing information', chunk);
      const score2 = retriever['bm25Score']('unrelated topic', chunk);
      
      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeGreaterThan(0);
      expect(score2).toBe(0);
    });

    it('should handle empty queries', () => {
      const chunk = {
        id: 'test-1',
        filename: 'test.md',
        content: 'Some content',
        paragraphIndex: 0
      };

      const score = retriever['bm25Score']('', chunk);
      
      expect(score).toBe(0);
    });
  });

  describe('search', () => {
    it('should return relevant chunks for pricing queries', () => {
      const results = retriever.search('pricing plans cost');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.filename).toBe('pricing.md');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should return relevant chunks for refund queries', () => {
      const results = retriever.search('refund money back');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.filename).toBe('refunds.md');
    });

    it('should return empty array for unrelated queries', () => {
      const results = retriever.search('completely unrelated topic that wont match');
      
      expect(results).toHaveLength(0);
    });

    it('should respect topK parameter', () => {
      // Add more chunks to test limiting
      const content = 'pricing pricing pricing ' + 'word '.repeat(50);
      for (let i = 0; i < 10; i++) {
        retriever['chunks'].push({
          id: `test-${i}`,
          filename: 'test.md',
          content: content + i,
          paragraphIndex: i
        });
      }

      const results = retriever.search('pricing');
      
      expect(results.length).toBeLessThanOrEqual(3); // topK = 3
    });
  });

  describe('getRelevantChunks', () => {
    it('should return citations with truncated content', () => {
      const citations = retriever.getRelevantChunks('pricing');
      
      expect(citations.length).toBeGreaterThan(0);
      expect(citations[0]).toHaveProperty('filename');
      expect(citations[0]).toHaveProperty('content');
      expect(citations[0]).toHaveProperty('paragraphIndex');
      expect(citations[0]).toHaveProperty('score');
      expect(citations[0].content.length).toBeLessThanOrEqual(203); // 200 + '...'
    });
  });
});