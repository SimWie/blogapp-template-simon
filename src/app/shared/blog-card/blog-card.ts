import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Blog } from '../../data/blog.model';

@Component({
  selector: 'app-blog-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.scss',
})
export class BlogCard {
  blog = input.required<Blog>();
  liked = output<number>();

  onLike(): void {
    this.liked.emit(this.blog().id);
  }
}
