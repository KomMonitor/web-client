import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import {
  TopicOrderMode,
  TopicResourceType,
} from "../admin-topics-management.component";
import {
  AdminTopicsManagementService,
  TopicOrderResponseEntry,
} from "../admin-topics-management.service";
import { FormsModule } from "@angular/forms";
import { finalize, catchError, delay } from "rxjs/operators";
import { throwError } from "rxjs";
import { NotificationService } from "../../../common/notification/notification.service";

@Component({
  selector: "topic-order-selection",
  templateUrl: "./topic-order-selection.component.html",
  styleUrls: ["./topic-order-selection.component.css"],
  imports: [FormsModule],
  standalone: true,
})
export class TopicOrderSelectionComponent implements OnInit, OnChanges {
  @Input({ required: true }) orderModes!: TopicOrderResponseEntry[];
  @Input({ required: true }) topicResourceType!: TopicResourceType;

  readonly ALPHABETICAL: TopicOrderMode = "alphabetical" as TopicOrderMode;
  readonly CUSTOM: TopicOrderMode = "custom" as TopicOrderMode;

  selectedOption: TopicOrderMode | undefined;
  isBusy = false;

  constructor(
    private topicSrvc: AdminTopicsManagementService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.syncSelectedOption();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["orderModes"] || changes["topicResourceType"]) {
      this.syncSelectedOption();
    }
  }

  private syncSelectedOption() {
    if (!this.orderModes || !this.topicResourceType) return;
    const match = this.orderModes.find(
      (mode) => mode.topicResource === this.topicResourceType,
    );
    this.selectedOption = match?.orderMode;
  }

  setOption(mode: TopicOrderMode) {
    const previous = this.selectedOption;
    this.selectedOption = mode;
    this.isBusy = true;

    this.topicSrvc
      .setOrderMode(this.topicResourceType, mode)
      .pipe(
        delay(1500),
        finalize(() => {
          this.isBusy = false;
        }),
        catchError((err) => {
          this.selectedOption = previous;
          this.notificationService.showError("Failed to update topic order.");
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: () => {
          // success — nothing additional needed for now
        },
      });
  }
}
