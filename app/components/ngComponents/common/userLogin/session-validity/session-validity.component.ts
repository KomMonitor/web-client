import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { AuthService } from "services/auth-service/auth.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: "app-session-validity",
  templateUrl: "./session-validity.component.html",
  standalone: true,
  imports: [AsyncPipe],
})
export class SessionValidityComponent {
  readonly minutes$: Observable<number>;

  constructor(private authService: AuthService) {
    this.minutes$ = this.authService.tokenExpirationMs$.pipe(
      map((ms) => Math.round(ms / 1000 / 60)),
    );
  }
}
