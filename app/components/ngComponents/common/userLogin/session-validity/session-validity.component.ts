import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from 'services/auth-service/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-session-validity',
  templateUrl: './session-validity.component.html',
  standalone: true,
  imports: [AsyncPipe],
})
export class SessionValidityComponent {
  private authService = inject(AuthService);

  readonly minutes$: Observable<number>;

  constructor() {
    this.minutes$ = this.authService.tokenExpirationMs$.pipe(
      map((ms) => Math.round(ms / 1000 / 60))
    );
  }
}
