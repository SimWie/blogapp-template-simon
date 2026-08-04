import { Component, signal, inject, OnInit } from '@angular/core';
import { Blog } from '../../shared/blog-card/blog.model';
import { BlogCard } from '../../shared/blog-card/blog-card';
import { BlogService } from '../../shared/blog-service/blog-service';

@Component({
  selector: 'app-blog-overview-page',
  imports: [BlogCard],
  templateUrl: './blog-overview-page.html',
  styleUrl: './blog-overview-page.scss',
})
export class BlogOverviewPage implements OnInit {
  private blogService = inject(BlogService);

  blogs = signal<Blog[]>([]);
  loading = signal(false);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      this.blogs.set(await this.blogService.getAll());
    } finally {
      this.loading.set(false);
    }
  }

  async onLike(blogId: number): Promise<void> {
    const blog = this.blogs().find((b) => b.id === blogId);
    if (!blog) {
      return;
    }

    const updated: Blog = {
      ...blog,
      likedByMe: !blog.likedByMe,
      likes: blog.likedByMe ? blog.likes - 1 : blog.likes + 1,
    };

    // Optimistic update, damit der Klick sofort sichtbar ist.
    this.blogs.set(this.blogs().map((b) => (b.id === blogId ? updated : b)));

    const result = await this.blogService.updateBlog(blogId, updated);
    if (!result) {
      // Backend-Call fehlgeschlagen -- Änderung zurückrollen.
      this.blogs.set(this.blogs().map((b) => (b.id === blogId ? blog : b)));
    }
  }
}
