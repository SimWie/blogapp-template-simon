import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-detail-page',
  imports: [MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './detail-page.html',
  styleUrl: './detail-page.scss',
})
export class DetailPage {
  private route = inject(ActivatedRoute);

  // Resolver-Daten aus der Route holen
  blog = computed(() => {
    const data = this.route.snapshot.data['blog'];
    return data ?? null;
  });
}
