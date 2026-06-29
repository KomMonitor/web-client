import { inject, Injectable } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { FavService } from 'services/fav-service/fav.service';

@Injectable({
  providedIn: 'root',
})
export class FavoritesStateService {
  private readonly favService = inject(FavService);
  private readonly topicHierarchyStore = inject(TopicHierarchyStoreService);
  private readonly broadcastService = inject(BroadcastService);

  indicatorFavTopicsTree: any[] = [];
  indicatorTopicFavItems: string[] = [];
  indicatorFavItems: string[] = [];
  wmsFavItems: string[] = [];
  toastStatus = 0;
  showFavSelection = false;

  readonly toastText = [
    '',
    'Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken',
    'Auswahl erfolgreich gespeichert',
  ];

  initFromUserInfo(): void {
    const userInfo = this.favService.getUserInfo();
    if (userInfo.indicatorFavourites) {
      this.indicatorFavItems = userInfo.indicatorFavourites;
    }
    if (userInfo.indicatorTopicFavourites) {
      this.indicatorTopicFavItems = userInfo.indicatorTopicFavourites;
    }
  }

  isIndicatorFavSelected(indicatorId: string): boolean {
    return this.indicatorFavItems.includes(indicatorId);
  }

  onIndicatorTopicFavClick(topicId: string): void {
    const selected = !this.indicatorTopicFavItems.includes(topicId);
    this.searchIndicatorTopicFavItemsRecursive(
      this.topicHierarchyStore.topicIndicatorHierarchy,
      topicId,
      selected
    );
    this.handleFavSelection();
  }

  onIndicatorFavClick(id: string): void {
    this.indicatorFavItems = this.toggleItem(this.indicatorFavItems, id);
    this.handleFavSelection();
  }

  onWmsFavClick(id: string): void {
    this.wmsFavItems = this.toggleItem(this.wmsFavItems, id);
    this.handleFavSelection();
  }

  onHeadlineIndicatorFavClick(id: string): void {
    const selecting = !this.indicatorFavItems.includes(id);
    this.indicatorFavItems = this.toggleItem(this.indicatorFavItems, id);
    this.checkBaseIndicatorFavItems(id, selecting);
    this.handleFavSelection();
  }

  onBaseIndicatorFavClick(id: string): void {
    this.indicatorFavItems = this.toggleItem(this.indicatorFavItems, id);
    this.handleFavSelection();
  }

  saveFavSelection(broadcast: boolean): void {
    if (broadcast) {
      this.favService.storeFavSelection();
      this.broadcastService.broadcast(BroadcastMessage.FavItemsStored, [false]);
    }
    this.setToastStatus(2);
  }

  setToastStatus(type: number): void {
    this.toastStatus = type;
    if (type === 2) {
      setTimeout(() => {
        this.toastStatus = 0;
      }, 1000);
    }
  }

  private handleFavSelection(): void {
    this.setToastStatus(1);
    this.favService.handleFavSelection({
      indicatorTopicFavourites: this.indicatorTopicFavItems,
      indicatorFavourites: this.indicatorFavItems,
      webServiceFavourites: this.wmsFavItems,
    });
  }

  private searchIndicatorTopicFavItemsRecursive(
    tree: any[],
    id: string,
    selected: boolean
  ): boolean {
    let ret = false;
    tree.forEach((entry) => {
      if (entry.topicId === id) {
        if (selected) {
          if (!this.indicatorTopicFavItems.includes(id)) this.indicatorTopicFavItems.push(id);
        } else {
          this.indicatorTopicFavItems = this.indicatorTopicFavItems.filter((e) => e !== id);
        }
        ret = true;
      } else {
        if (this.searchIndicatorTopicFavItemsRecursive(entry.subTopics, id, selected)) ret = true;
      }
    });
    return ret;
  }

  private checkBaseIndicatorFavItems(id: string, selected: boolean): void {
    this.topicHierarchyStore.headlineIndicatorHierarchy.forEach((entry: any) => {
      if (entry.headlineIndicator.indicatorId === id) {
        entry.baseIndicators.forEach((base: any) => {
          if (selected) {
            if (!this.indicatorFavItems.includes(base.indicatorId))
              this.indicatorFavItems.push(base.indicatorId);
          } else {
            this.indicatorFavItems = this.indicatorFavItems.filter((e) => e !== base.indicatorId);
          }
        });
      }
    });
  }

  private toggleItem(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((e) => e !== id) : [...arr, id];
  }
}
