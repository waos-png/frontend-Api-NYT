import { Component, HostListener, OnInit } from '@angular/core';
import { BooksService, Book, NytReview } from '../services/books.service';

type QueryType =
  | 'advice'
  | 'listNames'
  | 'listCurrent'
  | 'listByDate'
  | 'overview'
  | 'reviews'
  | 'history';

@Component({
  selector: 'app-books-list',
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.css']
})
export class BooksListComponent implements OnInit {
  readonly supportedEndpoints = 6;
  isOnline = navigator.onLine;

  queryTypes: { value: QueryType; label: string }[] = [
    { value: 'advice', label: 'Advice, How-To & Miscellaneous' },
    { value: 'listNames', label: 'Nombres de listas disponibles' },
    { value: 'listCurrent', label: 'Lista actual por categoria' },
    { value: 'listByDate', label: 'Lista por fecha y categoria' },
    { value: 'overview', label: 'Resumen de listas (fecha opcional)' },
    { value: 'reviews', label: 'Reseñas (título / autor / ISBN)' },
    { value: 'history', label: 'Historial de bestsellers (autor/título/ISBN/editorial)' }
  ];

  queryType: QueryType = 'advice';

  // Inputs
  listName = 'hardcover-fiction';
  date = '';
  publishedDate = '';
  title = '';
  author = '';
  isbn = '';
  publisher = '';
  offset: number | null = null;

  // Result state: each query writes to its own section (books, listNames, overviewLists, reviews, historyItems).
  books: Book[] = [];
  listNames: string[] = [];
  overviewLists: any[] = [];
  reviews: NytReview[] = [];
  historyItems: any[] = [];

  loading = false;
  error = '';
  selectedBook: Book | null = null;

  // Small UI helper text per query type.
  queryHelp: Record<QueryType, { help: string; example: string }> = {
    advice: {
      help: 'Consulta directa de la categoria Advice, How-To & Miscellaneous.',
      example: 'Ejemplo: advice-how-to-and-miscellaneous'
    },
    listNames: {
      help: 'Obtiene todas las categorias disponibles.',
      example: 'Ejemplo: hardcover-fiction'
    },
    listCurrent: {
      help: 'Lista actual de una categoria.',
      example: 'Ejemplo: hardcover-nonfiction'
    },
    listByDate: {
      help: 'Lista historica por fecha.',
      example: 'Ejemplo: 2023-01-01'
    },
    overview: {
      help: 'Resumen de varias listas en una sola respuesta.',
      example: 'Ejemplo: 2024-05-05'
    },
    reviews: {
      help: 'Reseñas filtradas por titulo/autor/ISBN.',
      example: 'Ejemplo: titulo = The Midnight Library'
    },
    history: {
      help: 'Historial de bestsellers con filtros.',
      example: 'Ejemplo: autor = Stephen King'
    }
  };

  constructor(private booksService: BooksService) {}

  ngOnInit(): void {
    this.search();
  }

  @HostListener('window:online')
  onOnline(): void {
    this.isOnline = true;
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.isOnline = false;
  }

  search(): void {
    this.loading = true;
    this.error = '';
    this.books = [];
    this.listNames = [];
    this.overviewLists = [];
    this.reviews = [];
    this.historyItems = [];

    switch (this.queryType) {
      case 'advice':
        this.booksService.getAdviceBooks().subscribe({
          next: (data) => {
            this.books = data;
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;

      case 'listNames':
        this.booksService.getListNames().subscribe({
          next: (data) => {
            this.listNames = data;
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;

      case 'listCurrent':
        if (!this.listName) {
          this.error = 'Debes indicar el nombre de la lista (ej: hardcover-fiction).';
          this.loading = false;
          return;
        }
        this.booksService.getCurrentList(this.listName).subscribe({
          next: (data) => {
            this.books = data;
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;

      case 'listByDate':
        if (!this.listName || !this.date) {
          this.error = 'Debes indicar nombre de lista y fecha (YYYY-MM-DD).';
          this.loading = false;
          return;
        }
        this.booksService.getListByDate(this.listName, this.date).subscribe({
          next: (data) => {
            this.books = data;
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;

      case 'overview':
        this.booksService.getOverview(this.publishedDate || undefined).subscribe({
          next: (data) => {
            this.overviewLists = data?.results?.lists ?? [];
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;

      case 'reviews':
        if (!this.title && !this.author && !this.isbn) {
          this.error = 'Indica al menos un titulo, un autor o un ISBN para buscar reseñas.';
          this.loading = false;
          return;
        }
        this.booksService.getReviews(this.title || undefined, this.author || undefined, this.isbn || undefined).subscribe({
          next: (data) => {
            this.reviews = data?.results ?? [];
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;

      case 'history':
        if (!this.author && !this.title && !this.isbn && !this.publisher) {
          this.error = 'Indica al menos uno: author, title, isbn o publisher.';
          this.loading = false;
          return;
        }
        this.booksService.getHistory({
          author: this.author || undefined,
          title: this.title || undefined,
          isbn: this.isbn || undefined,
          publisher: this.publisher || undefined,
          offset: this.offset ?? undefined
        }).subscribe({
          next: (data) => {
            this.historyItems = data?.results ?? [];
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
        break;
    }
  }

  handleError(err: any): void {
    console.error(err);

    const backendMsg = err?.error?.error || err?.error?.message;
    const hint = err?.error?.hint;

    this.error = backendMsg
      ? `${String(backendMsg)}${hint ? ` (${String(hint)})` : ''}`
      : 'Error al cargar datos desde el backend. Asegurate de que este ejecutandose en http://localhost:8080 y de que el backend pueda acceder a la NYT API.';

    this.loading = false;
  }

  selectBook(book: Book): void {
    this.selectedBook = book;
  }

  closeDetail(): void {
    this.selectedBook = null;
  }

  getImage(book: Book): string {
    return book.bookImage || 'assets/no-cover.svg';
  }

  getAnyImage(url?: string | null): string {
    return url || 'assets/no-cover.svg';
  }

  // Active filters summary for the UI.
  getActiveFilters(): { label: string; value: string }[] {
    const filters: { label: string; value: string }[] = [];

    if (this.queryType === 'listCurrent' || this.queryType === 'listByDate') {
      if (this.listName) filters.push({ label: 'Lista', value: this.listName });
    }
    if (this.queryType === 'listByDate' && this.date) {
      filters.push({ label: 'Fecha', value: this.date });
    }
    if (this.queryType === 'overview' && this.publishedDate) {
      filters.push({ label: 'Fecha', value: this.publishedDate });
    }
    if (this.queryType === 'reviews' || this.queryType === 'history') {
      if (this.title) filters.push({ label: 'Titulo', value: this.title });
      if (this.author) filters.push({ label: 'Autor', value: this.author });
      if (this.isbn) filters.push({ label: 'ISBN', value: this.isbn });
    }
    if (this.queryType === 'history') {
      if (this.publisher) filters.push({ label: 'Editorial', value: this.publisher });
      if (this.offset != null) filters.push({ label: 'Offset', value: String(this.offset) });
    }

    return filters;
  }

  getCurrentQueryLabel(): string {
    return this.queryTypes.find((option) => option.value === this.queryType)?.label ?? 'Consulta NYT';
  }
}
