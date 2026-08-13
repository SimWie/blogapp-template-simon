import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Blog } from '../blog-card/blog.model';
import { BlogService } from '../blog-service/blog-service';

interface BlogState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
  selectedAuthor: string;
}

const SELECTED_AUTHOR_STORAGE_KEY = 'blog-selected-author';

/**
 * Zentraler State für die Blog-Daten der ganzen App.
 *
 * Struktur: State (privates Signal) -- Derived State (öffentliche
 * computed()-Selektoren) -- Actions (öffentliche Methoden, reden mit dem
 * Backend) -- Reducer (private Methoden, schreiben den State).
 *
 * Komponenten dürfen nur lesen (über die computed()-Selektoren) und über
 * Actions Änderungen anstossen -- nie direkt in den State schreiben.
 */
@Injectable({
  providedIn: 'root',
})
export class BlogStateService {
  private blogService = inject(BlogService);

  // ─── State ────────────────────────────────────────────────────────────
  readonly #state = signal<BlogState>({
    blogs: [],
    loading: false,
    error: null,
    selectedAuthor: localStorage.getItem(SELECTED_AUTHOR_STORAGE_KEY) ?? 'all',
  });

  // ─── Derived State ────────────────────────────────────────────────────
  blogs = computed(() => this.#state().blogs);
  loading = computed(() => this.#state().loading);
  error = computed(() => this.#state().error);
  selectedAuthor = computed(() => this.#state().selectedAuthor);
  blogCount = computed(() => this.blogs().length);

  /** Alle Autoren aus den geladenen Blogs, ohne Duplikate -- die Auswahlliste des Filters. */
  authors = computed(() => [...new Set(this.blogs().map((blog) => blog.author))]);

  /** Blogs, gefiltert nach dem gewählten Autor ('all' zeigt alle). */
  filteredBlogs = computed(() => {
    const author = this.selectedAuthor();
    return author === 'all' ? this.blogs() : this.blogs().filter((blog) => blog.author === author);
  });

  constructor() {
    // Seiteneffekt: bei jeder Änderung von selectedAuthor die Auswahl in
    // localStorage persistieren, damit sie einen Reload übersteht.
    effect(() => {
      localStorage.setItem(SELECTED_AUTHOR_STORAGE_KEY, this.selectedAuthor());
    });
  }

  // ─── Actions ──────────────────────────────────────────────────────────

  /** Lädt alle Blogs vom Backend und bildet den kompletten Lade-Zyklus im State ab. */
  async loadBlogs(): Promise<void> {
    this.#loadStarted();
    try {
      const blogs = await this.blogService.getAll();
      this.#loadSucceeded(blogs);
    } catch (error) {
      console.error('Fehler beim Laden der Blogs:', error);
      this.#loadFailed('Die Blogs konnten nicht geladen werden. Bitte versuche es später erneut.');
    }
  }

  /** Setzt den Autor-Filter. */
  setAuthor(author: string): void {
    this.#authorSelected(author);
  }

  /** Toggelt "Gefällt mir" für einen Blog, optimistisch mit Rollback bei Fehler. */
  async toggleLike(blogId: number): Promise<void> {
    const blog = this.blogs().find((b) => b.id === blogId);
    if (!blog) {
      return;
    }

    const updated: Blog = {
      ...blog,
      likedByMe: !blog.likedByMe,
      likes: blog.likedByMe ? blog.likes - 1 : blog.likes + 1,
    };

    this.#blogUpdated(updated);

    const result = await this.blogService.updateBlog(blogId, updated);
    if (!result) {
      this.#blogUpdated(blog);
    }
  }

  // ─── Reducer ──────────────────────────────────────────────────────────

  /** Ladevorgang beginnt: Spinner an, alte Fehlermeldung weg. */
  #loadStarted(): void {
    this.#state.update((state) => ({ ...state, loading: true, error: null }));
  }

  /** Daten sind da: Liste übernehmen, Spinner aus. */
  #loadSucceeded(blogs: Blog[]): void {
    this.#state.update((state) => ({ ...state, blogs, loading: false }));
  }

  /** Laden fehlgeschlagen: Fehlermeldung setzen, Spinner aus. */
  #loadFailed(message: string): void {
    this.#state.update((state) => ({ ...state, error: message, loading: false }));
  }

  /** Neuer Autor-Filter ausgewählt. */
  #authorSelected(author: string): void {
    this.#state.update((state) => ({ ...state, selectedAuthor: author }));
  }

  /** Ein einzelner Blog wurde ersetzt (z.B. nach einem Like-Toggle). */
  #blogUpdated(blog: Blog): void {
    this.#state.update((state) => ({
      ...state,
      blogs: state.blogs.map((b) => (b.id === blog.id ? blog : b)),
    }));
  }
}
