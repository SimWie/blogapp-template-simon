import { Component, signal, inject } from '@angular/core';
import { Blog } from '../../shared/blog-card/blog.model';
import { BlogCard } from '../../shared/blog-card/blog-card';
import { BlogService } from '../../shared/blog-service/blog-service';

@Component({
  selector: 'app-blog-overview-page',
  imports: [BlogCard],
  templateUrl: './blog-overview-page.html',
  styleUrl: './blog-overview-page.scss',
})
export class BlogOverviewPage {
  private blogService = inject(BlogService);

  blogs = signal<Blog[]>(this.blogService.getAll());

  onLike(blogId: number): void {
    this.blogs.update((blogs) =>
      blogs.map((blog) =>
        blog.id === blogId
          ? {
              ...blog,
              likedByMe: !blog.likedByMe,
              likes: blog.likedByMe ? blog.likes - 1 : blog.likes + 1,
            }
          : blog,
      ),
    );
  }
}
