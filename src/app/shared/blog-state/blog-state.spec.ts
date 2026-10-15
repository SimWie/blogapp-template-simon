import { TestBed } from '@angular/core/testing';

import { Blog } from '../blog-card/blog.model';
import { BlogService } from '../blog-service/blog-service';
import { BlogStateService } from './blog-state';

function makeBlog(overrides: Partial<Blog> = {}): Blog {
  return {
    id: 1,
    title: 'Test Blog',
    contentPreview: 'Vorschau',
    author: 'Anna',
    likes: 0,
    comments: 0,
    likedByMe: false,
    createdByMe: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('BlogStateService', () => {
  // Gemockter BlogService: kein echter HTTP-Call, jeder Test steuert die
  // Rückgabewerte selbst.
  const blogServiceMock = {
    getAll: vi.fn<() => Promise<Blog[]>>(),
    updateBlog: vi.fn<(id: number, blog: Blog) => Promise<Blog | null>>(),
  };

  let service: BlogStateService;

  beforeEach(() => {
    // selectedAuthor wird in localStorage persistiert -- ohne Aufräumen
    // würde ein Test den Startzustand des nächsten verändern.
    localStorage.clear();
    blogServiceMock.getAll.mockReset();
    blogServiceMock.updateBlog.mockReset();

    TestBed.configureTestingModule({
      providers: [{ provide: BlogService, useValue: blogServiceMock }],
    });
    service = TestBed.inject(BlogStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty blogs array', () => {
    expect(service.blogs()).toEqual([]);
    expect(service.blogCount()).toBe(0);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should update loading state', async () => {
    // Promise von Hand steuern, damit wir den Zustand "mitten im Laden" sehen.
    let resolveGetAll!: (blogs: Blog[]) => void;
    blogServiceMock.getAll.mockReturnValue(
      new Promise<Blog[]>((resolve) => {
        resolveGetAll = resolve;
      }),
    );

    const loading = service.loadBlogs();
    expect(service.loading()).toBe(true);

    resolveGetAll([makeBlog()]);
    await loading;

    expect(service.loading()).toBe(false);
  });

  it('should calculate blog count', async () => {
    blogServiceMock.getAll.mockResolvedValue([
      makeBlog({ id: 1 }),
      makeBlog({ id: 2 }),
      makeBlog({ id: 3 }),
    ]);

    await service.loadBlogs();

    expect(service.blogCount()).toBe(3);
  });

  it('should set error message and stop loading when loading fails', async () => {
    // loadBlogs() loggt den Fehler per console.error -- im Test unterdrücken.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    blogServiceMock.getAll.mockRejectedValue(new Error('Netzwerkfehler'));

    await service.loadBlogs();

    expect(service.loading()).toBe(false);
    expect(service.error()).toContain('konnten nicht geladen werden');
    expect(service.blogs()).toEqual([]);
  });

  it('should filter blogs by selected author', async () => {
    blogServiceMock.getAll.mockResolvedValue([
      makeBlog({ id: 1, author: 'Anna' }),
      makeBlog({ id: 2, author: 'Ben' }),
      makeBlog({ id: 3, author: 'Anna' }),
    ]);
    await service.loadBlogs();

    expect(service.authors()).toEqual(['Anna', 'Ben']);
    expect(service.filteredBlogs()).toHaveLength(3);

    service.setAuthor('Anna');

    expect(service.filteredBlogs().map((b) => b.id)).toEqual([1, 3]);
  });

  it('should toggle like and keep the update when the backend succeeds', async () => {
    blogServiceMock.getAll.mockResolvedValue([makeBlog({ id: 1, likes: 2, likedByMe: false })]);
    await service.loadBlogs();
    blogServiceMock.updateBlog.mockImplementation((_id, blog) => Promise.resolve(blog));

    await service.toggleLike(1);

    expect(service.blogs()[0].likedByMe).toBe(true);
    expect(service.blogs()[0].likes).toBe(3);
  });

  it('should roll back the like when the backend fails', async () => {
    blogServiceMock.getAll.mockResolvedValue([makeBlog({ id: 1, likes: 2, likedByMe: false })]);
    await service.loadBlogs();
    blogServiceMock.updateBlog.mockResolvedValue(null);

    await service.toggleLike(1);

    expect(service.blogs()[0].likedByMe).toBe(false);
    expect(service.blogs()[0].likes).toBe(2);
  });
});
