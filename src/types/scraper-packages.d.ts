declare module "google-play-scraper" {
  interface ListOptions {
    category?: string;
    collection?: string;
    num?: number;
    country?: string;
    lang?: string;
  }
  interface AppOptions {
    appId: string;
    lang?: string;
    country?: string;
  }
  interface ReviewOptions {
    appId: string;
    num?: number;
    sort?: number;
    lang?: string;
    country?: string;
    paginate?: boolean;
  }
  interface AppResult {
    appId: string;
    title: string;
    score: number;
    ratings: number;
    maxInstalls: number;
    summary: string;
    description: string;
    icon: string;
    url: string;
    developer: string;
    genre: string;
    installs: string;
  }
  interface ReviewResult {
    id: string;
    text: string;
    score: number;
    date: string;
    thumbsUp: number;
  }
  interface ReviewResponse {
    data: ReviewResult[];
  }

  interface SearchOptions {
    term: string;
    num?: number;
    country?: string;
    lang?: string;
    fullDetail?: boolean;
    price?: string;
  }

  interface GooglePlayScraper {
    collection: { TOP_FREE: string; GROSSING: string };
    sort: { NEWEST: number; RATING: number; HELPFULNESS: number };
    list(options: ListOptions): Promise<AppResult[]>;
    app(options: AppOptions): Promise<AppResult>;
    reviews(options: ReviewOptions): Promise<ReviewResponse>;
    search(options: SearchOptions): Promise<AppResult[]>;
  }

  const gplay: GooglePlayScraper;
  export default gplay;
}

declare module "app-store-scraper" {
  interface ListOptions {
    category?: number | string;
    collection?: string;
    num?: number;
    country?: string;
    lang?: string;
  }
  interface ReviewOptions {
    id: string | number;
    country?: string;
    sort?: number;
    page?: number;
  }
  interface AppResult {
    id: string | number;
    title: string;
    score: number;
    reviews: number;
    icon: string;
    url: string;
    developer: string;
    description: string;
    primaryGenre: string;
  }
  interface ReviewResult {
    id: string;
    text: string;
    title: string;
    score: number;
    date: string;
  }

  interface AppOptions {
    id: string | number;
    country?: string;
    lang?: string;
  }

  interface SearchOptions {
    term: string;
    num?: number;
    country?: string;
    lang?: string;
  }

  interface AppStoreScraper {
    collection: { TOP_FREE_IPHONE: string; TOP_FREE_IOS: string; TOP_GROSSING_IOS: string };
    sort: { RECENT: number };
    app(options: AppOptions): Promise<AppResult>;
    list(options: ListOptions): Promise<AppResult[]>;
    reviews(options: ReviewOptions): Promise<ReviewResult[]>;
    search(options: SearchOptions): Promise<AppResult[]>;
  }

  const store: AppStoreScraper;
  export default store;
}
