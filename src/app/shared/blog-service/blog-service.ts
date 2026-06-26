import { Injectable } from '@angular/core';
import { Blog } from '../blog-card/blog.model';
import blogData from '../../data/blogs.json';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private blogs: Blog[] = blogData as Blog[];

  // Alle Blogs ausgeben
  getAll(): Blog[] {
    return this.blogs;
  }

  // Bestimmten Blog ausgeben
  getBlogByID(id: number): Blog | undefined {
    return this.blogs.find((b) => b.id === id);
  }
}
