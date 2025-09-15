import { load, CheerioAPI } from 'cheerio';

export interface ScrapedContent {
  url: string;
  content: string;
  title: string;
  depth: number;
}

export interface ScrapeOptions {
  maxDepth: number;
  delay?: number;
  maxPages?: number;
  includeExternalLinks?: boolean;
  excludePatterns?: RegExp[];
}

export class WebScraper {
  private readonly baseUrl: URL;
  private readonly visitedUrls = new Set<string>();
  private readonly results: ScrapedContent[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = new URL(baseUrl);
  }

  async scrape(options: ScrapeOptions): Promise<ScrapedContent[]> {
    const config = this.validateOptions(options);
    this.reset();
    
    await this.scrapeRecursively(this.baseUrl.href, 0, config);
    return [...this.results];
  }

  private validateOptions(options: ScrapeOptions): Required<ScrapeOptions> {
    return {
      maxDepth: Math.max(0, options.maxDepth),
      delay: Math.max(100, options.delay ?? 1000),
      maxPages: Math.max(1, options.maxPages ?? 50),
      includeExternalLinks: options.includeExternalLinks ?? false,
      excludePatterns: options.excludePatterns ?? []
    };
  }

  private reset(): void {
    this.visitedUrls.clear();
    this.results.length = 0;
  }

  private async scrapeRecursively(
    url: string, 
    depth: number, 
    options: Required<ScrapeOptions>
  ): Promise<void> {
    if (this.shouldStop(url, depth, options)) return;

    this.visitedUrls.add(url);

    try {
      const content = await this.extractContent(url, depth);
      if (!content) return;

      this.results.push(content);

      if (depth < options.maxDepth) {
        const links = await this.extractLinks(url, options);
        
        for (const link of links) {
          if (options.delay > 0) await this.delay(options.delay);
          await this.scrapeRecursively(link, depth + 1, options);
        }
      }
    } catch (error) {
      console.warn(`Failed to scrape ${url}:`, error);
    }
  }

  private shouldStop(
    url: string, 
    depth: number, 
    options: Required<ScrapeOptions>
  ): boolean {
    return (
      depth > options.maxDepth ||
      this.visitedUrls.has(url) ||
      this.results.length >= options.maxPages ||
      this.isExcludedUrl(url, options)
    );
  }

  private isExcludedUrl(url: string, options: Required<ScrapeOptions>): boolean {
    const urlObj = new URL(url);
    
    // Check domain restrictions
    if (!options.includeExternalLinks && urlObj.hostname !== this.baseUrl.hostname) {
      return true;
    }

    // Check exclude patterns
    if (options.excludePatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Check file extensions and common exclusions
    const skipPatterns = [
      /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|gif|mp4|zip)$/i,
      /\/(login|logout|register|admin|search)/i,
      /#/
    ];

    return skipPatterns.some(pattern => pattern.test(url));
  }

  private async extractContent(url: string, depth: number): Promise<ScrapedContent | null> {
    const response = await fetch(url);
    if (!response.ok) return null;

    const html = await response.text();
    const $ = load(html);

    const title = this.extractTitle($);
    const content = this.extractMainContent($);

    if (content.length < 50) return null;

    return { url, title, content, depth };
  }

  private extractTitle($: CheerioAPI): string {
    return (
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      'Untitled'
    );
  }

  private extractMainContent($: CheerioAPI): string {
    // Remove noise elements
    $(this.getNoiseSelectors().join(', ')).remove();

    // Try to find main content container
    const mainContainer = this.findMainContainer($);
    const container = mainContainer.length ? mainContainer : $('body');

    const contentParts: string[] = [];
    const seenTexts = new Set<string>();

    // Extract structured content
    container.find('h1, h2, h3, h4, h5, h6, p, li, blockquote').each((_, el) => {
      const text = $(el).text().trim();
      const isHeading = /^h[1-6]$/i.test(el.tagName);

      if (this.isValidText(text, seenTexts)) {
        contentParts.push(isHeading ? `## ${text}` : text);
        seenTexts.add(text);
      }
    });

    return contentParts
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private getNoiseSelectors(): string[] {
    return [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.social', '.share', '.navigation', '.breadcrumb',
      '.advertisement', '.sidebar', '.menu', 'button', 'form', 'a'
    ];
  }

  private findMainContainer($: CheerioAPI) {
    const selectors = [
      'article', '[role="main"]', '.content', 
      '.article-content', '.post-content', 'main'
    ];

    for (const selector of selectors) {
      const container = $(selector).first();
      if (container.length && container.text().trim().length > 100) {
        return container;
      }
    }

    return $();
  }

  private isValidText(text: string, seenTexts: Set<string>): boolean {
    return (
      text.length > 10 &&
      text.length < 1000 &&
      !seenTexts.has(text) &&
      !this.isUIText(text)
    );
  }

  private isUIText(text: string): boolean {
    const uiPatterns = [
      /^(home|about|contact|menu|search|login)$/i,
      /^(next|previous|back|share|like)$/i,
      /^(©|copyright|all rights reserved)$/i
    ];

    return uiPatterns.some(pattern => pattern.test(text));
  }

  private async extractLinks(url: string, options: Required<ScrapeOptions>): Promise<string[]> {
    const response = await fetch(url);
    if (!response.ok) return [];

    const html = await response.text();
    const $ = load(html);
    const links = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, url).href;
        
        if (!this.visitedUrls.has(absoluteUrl) && 
            !this.isExcludedUrl(absoluteUrl, options)) {
          links.add(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    });

    return Array.from(links);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function for ease of use
export async function scrapeWebsite(
  baseUrl: string,
  options: ScrapeOptions
): Promise<ScrapedContent[]> {
  const scraper = new WebScraper(baseUrl);
  return scraper.scrape(options);
}