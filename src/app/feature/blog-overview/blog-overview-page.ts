import { Component, OnInit, inject } from '@angular/core';
import { BlogCard } from '../../shared/blog-card/blog-card';
import { BlogStateService } from '../../shared/blog-state/blog-state';

@Component({
  selector: 'app-blog-overview-page',
  imports: [BlogCard],
  templateUrl: './blog-overview-page.html',
  styleUrl: './blog-overview-page.scss',
})
export class BlogOverviewPage implements OnInit {
  protected readonly state = inject(BlogStateService);

  ngOnInit(): void {
    void this.state.loadBlogs();
  }

  onLike(blogId: number): void {
    void this.state.toggleLike(blogId);
  }

  onAuthorChange(author: string): void {
    this.state.setAuthor(author);
  }
}
