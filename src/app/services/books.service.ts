import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Book {
  title: string;
  author: string;
  description: string;
  publisher: string;
  bookImage: string;
}

export interface NytReview {
  book_title?: string;
  book_author?: string;
  summary?: string;
  url?: string;
  publication_dt?: string;
  isbn13?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private apiRoot = this.resolveApiRoot();

  constructor(private http: HttpClient) {}

  private resolveApiRoot(): string {
    const config = (window as Window & { __APP_CONFIG__?: { apiBaseUrl?: string } }).__APP_CONFIG__;
    return config?.apiBaseUrl || 'http://localhost:8080/books';
  }

  // Backend proxy endpoints (the backend adds the NYT api-key safely).
  getAdviceBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiRoot}/nyt-advice`);
  }

  // List of list_name_encoded values.
  getListNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiRoot}/lists/names`);
  }

  // Current list by category.
  getCurrentList(listName: string): Observable<Book[]> {
    const params = new HttpParams().set('name', listName);
    return this.http.get<Book[]>(`${this.apiRoot}/lists/current`, { params });
  }

  // List by date and category.
  getListByDate(listName: string, date: string): Observable<Book[]> {
    const params = new HttpParams().set('name', listName).set('date', date);
    return this.http.get<Book[]>(`${this.apiRoot}/lists/by-date`, { params });
  }

  // NYT endpoint: /lists/overview.json (publishedDate optional)
  getOverview(publishedDate?: string): Observable<any> {
    let params = new HttpParams();
    if (publishedDate) {
      params = params.set('publishedDate', publishedDate);
    }
    return this.http.get<any>(`${this.apiRoot}/lists/overview`, { params });
  }

  getReviews(title?: string, author?: string, isbn?: string): Observable<any> {
    let params = new HttpParams();
    if (title) { params = params.set('title', title); }
    if (author) { params = params.set('author', author); }
    if (isbn) { params = params.set('isbn', isbn); }
    return this.http.get<any>(`${this.apiRoot}/reviews`, { params });
  }

  // NYT endpoint: /lists/best-sellers/history.json (filters + offset optional)
  getHistory(filters?: { author?: string; title?: string; isbn?: string; publisher?: string; offset?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters?.author) { params = params.set('author', filters.author); }
    if (filters?.title) { params = params.set('title', filters.title); }
    if (filters?.isbn) { params = params.set('isbn', filters.isbn); }
    if (filters?.publisher) { params = params.set('publisher', filters.publisher); }
    if (filters?.offset != null) { params = params.set('offset', String(filters.offset)); }
    return this.http.get<any>(`${this.apiRoot}/history`, { params });
  }
}
