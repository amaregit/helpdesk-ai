import { DocumentChunk, SearchResult, Citation } from './types';
import fs from 'fs';
import path from 'path';

export class Retriever {
  private chunks: DocumentChunk[] = [];
  private readonly chunkSize = 200;
  private readonly topK = 3;
  private isIndexed = false;

  constructor() {
    this.loadDocuments();
  }

  private loadDocuments() {
    try {
      const dataDir = path.join(process.cwd(), 'src/data');

      // Dynamically load all .md files in the data directory
      const files = fs.readdirSync(dataDir)
        .filter(filename => filename.endsWith('.md'))
        .sort(); // Sort for consistent ordering

      files.forEach(filename => {
        const filePath = path.join(dataDir, filename);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          this.chunks.push(...this.splitDocument(content, filename));
        } catch (error) {
          console.warn(`Error reading document file ${filename}:`, error);
        }
      });

      this.isIndexed = true;
      console.log(`Indexed ${this.chunks.length} chunks from ${files.length} files`);
    } catch (error) {
      console.error('Error loading documents:', error);
      this.isIndexed = false;
    }
  }

  private splitDocument(content: string, filename: string): DocumentChunk[] {
    // Improved paragraph-based splitting with better content filtering
    const paragraphs = content.split('\n\n').filter(p => {
      const trimmed = p.trim();
      return trimmed.length > 10 && // Allow shorter content for better coverage
             !trimmed.startsWith('```') &&
             !trimmed.startsWith('###') && // Allow main headers but filter sub-subheaders
             trimmed.length < 1000;
    });

    return paragraphs.map((paragraph, index) => ({
      id: `${filename}-${index}`,
      filename,
      content: paragraph.trim(),
      paragraphIndex: index
    }));
  }

  // BM25-inspired scoring (improved with semantic awareness)
  private bm25Score(query: string, chunk: DocumentChunk): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const content = chunk.content.toLowerCase();

    if (queryTerms.length === 0) return 0;

    let score = 0;
    let matchedTerms = 0;

    queryTerms.forEach(term => {
      const termFrequency = (content.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (termFrequency > 0) {
        matchedTerms++;

        // Base TF scoring with diminishing returns
        score += Math.min(termFrequency, 3); // Cap at 3 to prevent spam

        // Context-aware bonuses
        // Higher bonus for important terms (refund, pricing, etc.)
        const importantTerms = ['refund', 'pricing', 'cancel', 'payment', 'api', 'key', 'start', 'tier', 'plan', 'included'];
        if (importantTerms.includes(term)) {
          score += 3;
        }

        // Bonus for terms near each other (phrase matching)
        const termIndex = content.indexOf(term);
        if (termIndex !== -1) {
          // Check if other query terms are nearby
          const nearbyWindow = 100; // characters
          let nearbyMatches = 0;
          queryTerms.forEach(otherTerm => {
            if (otherTerm !== term) {
              const otherIndex = content.indexOf(otherTerm);
              if (otherIndex !== -1 && Math.abs(otherIndex - termIndex) < nearbyWindow) {
                nearbyMatches++;
              }
            }
          });
          score += nearbyMatches * 0.5; // Bonus for terms appearing together
        }
      }
    });

    // Remove the generic term penalty entirely - it was causing false negatives
    // The important term bonuses and phrase matching should be sufficient

    // Normalize by query length and matched terms ratio
    const matchRatio = matchedTerms / queryTerms.length;
    return (score * matchRatio) / Math.max(queryTerms.length, 1);
  }

  public search(query: string): SearchResult[] {
    if (!this.isIndexed || this.chunks.length === 0) {
      console.warn('Retriever not properly indexed');
      return [];
    }

    const results = this.chunks.map(chunk => ({
      chunk,
      score: this.bm25Score(query, chunk)
    }));

    // Filter and sort by score
    const filteredResults = results
      .filter(result => result.score > 0.1) // Lower threshold to allow more results for complex queries
      .sort((a, b) => b.score - a.score)
      .slice(0, this.topK);

    console.log(`Search for "${query}" returned ${filteredResults.length} results`);
    return filteredResults;
  }

  public getRelevantChunks(query: string): Citation[] {
    const results = this.search(query);

    return results.map(result => ({
      filename: result.chunk.filename,
      content: result.chunk.content, // Show full content without truncation
      paragraphIndex: result.chunk.paragraphIndex,
      score: result.score
    }));
  }

  // For admin re-indexing
  public reindex(): boolean {
    try {
      this.chunks = [];
      this.loadDocuments();
      return this.isIndexed;
    } catch (error) {
      console.error('Error reindexing:', error);
      return false;
    }
  }

  public getIndexStatus() {
    return {
      isIndexed: this.isIndexed,
      chunkCount: this.chunks.length,
      documents: [...new Set(this.chunks.map(chunk => chunk.filename))]
    };
  }
}

// Singleton instance
export const retriever = new Retriever();