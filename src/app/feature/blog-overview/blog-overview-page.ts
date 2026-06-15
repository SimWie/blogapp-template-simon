import { Component, signal } from '@angular/core';
import { Blog } from '../../data/blog.model';
import { BlogCard } from '../../shared/blog-card/blog-card';
import blogData from '../../data/blogs.json';

@Component({
  selector: 'app-blog-overview-page',
  imports: [BlogCard],
  templateUrl: './blog-overview-page.html',
  styleUrl: './blog-overview-page.scss',
})
export class BlogOverviewPage {
  blogs = signal<Blog[]>(blogData as Blog[]);

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
