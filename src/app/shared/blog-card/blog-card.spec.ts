import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BlogCard } from './blog-card';
import { Blog } from './blog.model';

const testBlog: Blog = {
  id: 42,
  title: 'Test Blog',
  contentPreview: 'Eine kurze Vorschau',
  author: 'Anna',
  likes: 5,
  comments: 2,
  likedByMe: false,
  createdByMe: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('BlogCard', () => {
  let fixture: ComponentFixture<BlogCard>;
  let element: HTMLElement;

  // Shallow Test: nur die BlogCard selbst wird gerendert. provideRouter([])
  // braucht sie nur, weil das Template ein [routerLink] enthält.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogCard);
    // blog ist ein required Signal-Input -> setInput() statt direkter Zuweisung.
    fixture.componentRef.setInput('blog', testBlog);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display blog title', () => {
    expect(element.querySelector('mat-card-title')?.textContent).toContain('Test Blog');
  });

  it('should display author and preview', () => {
    expect(element.querySelector('mat-card-subtitle')?.textContent).toContain('Anna');
    expect(element.querySelector('mat-card-content')?.textContent).toContain('Eine kurze Vorschau');
  });

  it('should not render a header image when headerImageUrl is missing', () => {
    expect(element.querySelector('img')).toBeNull();
  });

  it('should render a header image when headerImageUrl is set', () => {
    fixture.componentRef.setInput('blog', {
      ...testBlog,
      headerImageUrl: 'https://example.com/a.png',
    });
    fixture.detectChanges();

    const image = element.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://example.com/a.png');
    expect(image?.getAttribute('alt')).toBe('Test Blog');
  });

  it('should show an outlined heart when not liked and a filled one when liked', () => {
    const heart = () => element.querySelector('mat-card-actions mat-icon')?.textContent?.trim();
    expect(heart()).toBe('favorite_border');

    fixture.componentRef.setInput('blog', { ...testBlog, likedByMe: true });
    fixture.detectChanges();

    expect(heart()).toBe('favorite');
  });

  it('should emit the blog id when the like button is clicked', () => {
    const likedSpy = vi.fn();
    fixture.componentInstance.liked.subscribe(likedSpy);

    element.querySelector<HTMLButtonElement>('button')?.click();

    expect(likedSpy).toHaveBeenCalledOnce();
    expect(likedSpy).toHaveBeenCalledWith(42);
  });
});
