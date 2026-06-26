import { inject, Injectable } from "@angular/core";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { BroadcastMessage } from "services/broadcast-service/broadcast-message";
import { TopicHierarchyStoreService } from "services/topic-hierarchy-store-service/topic-hierarchy-store.service";
import { FavService } from "services/fav-service/fav.service";
import { WmsDataset } from "components/ngComponents/models/services.models";

/**
 * Holds the georesource favourite-selection state (POI/LOI/AOI, WMS and topic
 * favourites) and the related selection/persistence logic that used to live in
 * {@link PoiComponent}. Mirrors the indicators `FavoritesStateService`.
 *
 * The `FavTab*` arrays are a separate copy of the favourites so that items
 * remain visible in the favourites tab even after being toggled off, until the
 * selection is saved or reloaded.
 */
@Injectable({ providedIn: "root" })
export class GeoresourceFavoritesService {
  private readonly favService = inject(FavService);
  private readonly topicHierarchyStore = inject(TopicHierarchyStoreService);
  private readonly broadcastService = inject(BroadcastService);

  georesourceFavTopicsTree: any[] = [];

  georesourceTopicFavItems: any[] = [];
  poiFavItems: any[] = [];
  wmsFavItems: any[] = [];

  // own temp list as fav items should remain visible in fav-tab even if deleted, until save/reload
  FavTabGeoresourceTopicFavItems: any[] = [];
  FavTabPoiFavItems: any[] = [];
  FavTabWmsFavItems: any[] = [];

  toastStatus = 0;

  readonly toastText = [
    "",
    "Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken",
    "Auswahl erfolgreich gespeichert",
  ];

  /** Builds the flattened favourites topic tree from the topic hierarchy. */
  buildFavTopicsTree(): void {
    this.georesourceFavTopicsTree = this.prepTopicsTree(
      this.topicHierarchyStore.topicGeoresourceHierarchy,
      0,
      undefined,
    );
  }

  initFromUserInfo(): void {
    const userInfo = this.favService.getUserInfo();

    if (userInfo.georesourceFavourites) {
      this.poiFavItems = userInfo.georesourceFavourites;
      this.wmsFavItems = userInfo.webServiceFavourites;
      this.FavTabPoiFavItems = userInfo.georesourceFavourites;
      this.FavTabWmsFavItems = userInfo.webServiceFavourites;
    }

    if (userInfo.georesourceTopicFavourites) {
      this.georesourceTopicFavItems = userInfo.georesourceTopicFavourites;
      this.FavTabGeoresourceTopicFavItems = userInfo.georesourceTopicFavourites;
    }
  }

  prepTopicsTree(tree, level, parent) {
    tree.forEach((entry) => {
      entry.level = level;
      entry.parent = parent;

      if (entry.subTopics.length > 0) {
        let newLevel = level + 1;
        entry.subTopics = this.prepTopicsTree(
          entry.subTopics,
          newLevel,
          entry.topicId,
        );
      }
    });

    return tree;
  }

  georesourceTopicFavSelected(topicId) {
    return this.georesourceTopicFavItems.includes(topicId);
  }

  poiFavSelected(id) {
    if (Array.isArray(id))
      return id.some((e) => this.poiFavItems.includes(e.georesourceId));
    else return this.poiFavItems.includes(id);
  }

  wmsFavSelected(id) {
    if (Array.isArray(id))
      return id.some((e) => this.wmsFavItems.includes(e.id));
    else return this.wmsFavItems.includes(id);
  }

  onPoiFavClick(id, favTab = false) {
    if (!this.poiFavItems.includes(id)) this.poiFavItems.push(id);
    else this.poiFavItems = this.poiFavItems.filter((e) => e != id);

    this.onHandleFavSelection(favTab);
  }

  onWmsFavClick(id, favTab = false) {
    if (!this.wmsFavItems.includes(id)) this.wmsFavItems.push(id);
    else this.wmsFavItems = this.wmsFavItems.filter((e) => e != id);

    this.onHandleFavSelection(favTab);
  }

  onGeoresourceTopicFavClick(topicId, favTab = false) {
    if (!this.georesourceTopicFavItems.includes(topicId))
      this.searchGeoresourceTopicFavItemsRecursive(
        this.topicHierarchyStore.topicGeoresourceHierarchy,
        topicId,
        true,
      );
    else
      this.searchGeoresourceTopicFavItemsRecursive(
        this.topicHierarchyStore.topicGeoresourceHierarchy,
        topicId,
        false,
      );

    this.onHandleFavSelection(favTab);
  }

  onHandleFavSelection(favTab = false) {
    if (favTab === false) {
      this.FavTabGeoresourceTopicFavItems = this.georesourceTopicFavItems;
      this.FavTabPoiFavItems = this.poiFavItems;
    }

    this.handleToastStatus(1);

    this.favService.handleFavSelection({
      georesourceTopicFavourites: this.georesourceTopicFavItems,
      georesourceFavourites: this.poiFavItems,
    });
  }

  onSaveFavSelection([broadcast = true]) {
    if (broadcast === true) this.favService.storeFavSelection();

    this.FavTabGeoresourceTopicFavItems = this.georesourceTopicFavItems;
    this.FavTabPoiFavItems = this.poiFavItems;

    this.handleToastStatus(2);

    if (broadcast === true)
      this.broadcastService.broadcast(BroadcastMessage.GeoFavItemsStored, [false]);
  }

  favItemsStored() {
    this.onSaveFavSelection([false]);
  }

  handleToastStatus(type) {
    this.toastStatus = type;

    if (type == 2) {
      setTimeout(() => {
        this.toastStatus = 0;
      }, 1000);
    }
  }

  searchGeoresourceTopicFavItemsRecursive(tree, id, selected) {
    let ret = false;

    tree.forEach((entry) => {
      if (entry.topicId == id) {
        if (selected === true) {
          if (!this.georesourceTopicFavItems.includes(id))
            this.georesourceTopicFavItems.push(id);
        } else
          this.georesourceTopicFavItems = this.georesourceTopicFavItems.filter(
            (e) => e != id,
          );

        ret = true;
      } else {
        let itemFound = this.searchGeoresourceTopicFavItemsRecursive(
          entry.subTopics,
          id,
          selected,
        );
        if (itemFound === true) ret = true;
      }
    });

    return ret;
  }

  checkGeoresourceDataFavItems(entry, selected) {
    let types = [
      {
        typeName: "poiData",
        typeFav: "poiFavItems",
      },
      {
        typeName: "aoiData",
        typeFav: "poiFavItems",
      },
      {
        typeName: "loiData",
        typeFav: "poiFavItems",
      },
    ];

    types.forEach((type) => {
      entry[type.typeName].forEach((typeElem) => {
        if (selected === true) {
          if (!this[type.typeFav].includes(typeElem.georesourceId))
            this[type.typeFav].push(typeElem.georesourceId);
        } else
          this[type.typeFav] = this[type.typeFav].filter(
            (e) => e != typeElem.georesourceId,
          );
      });
    });
  }

  checkGeoresourceTopicFavItemsRecursive(tree, selected) {
    tree.forEach((entry) => {
      if (selected === true) {
        if (!this.georesourceTopicFavItems.includes(entry.topicId))
          this.georesourceTopicFavItems.push(entry.topicId);
      } else
        this.georesourceTopicFavItems = this.georesourceTopicFavItems.filter(
          (e) => e != entry.topicId,
        );

      if (entry.subTopics.length > 0)
        this.checkGeoresourceTopicFavItemsRecursive(entry.subTopics, selected);

      if (
        entry.poiData.length > 0 ||
        entry.aoiData.length > 0 ||
        entry.loiData.length > 0
      )
        this.checkGeoresourceDataFavItems(entry, selected);
    });
  }

  favTabShowTopic(topic) {
    if (
      this.topicOrGeoresourceInFavRecursive([topic]) ||
      this.topicInFavTopBottom(topic)
    )
      return true;

    return false;
  }

  topicInFavTopBottom(topic) {
    var parentNext = topic.parent;
    var ret = false;

    if (this.FavTabGeoresourceTopicFavItems.includes(topic.topicId)) ret = true;

    while (parentNext !== undefined && ret === false) {
      ret = this.parentInFavRecursive(
        this.georesourceFavTopicsTree,
        parentNext,
      );
      if (ret === false)
        parentNext = this.findParentNextRecursive(
          this.georesourceFavTopicsTree,
          parentNext,
        );
    }

    return ret;
  }

  parentInFavRecursive(tree, parentId) {
    var ret = false;
    tree.forEach((elem) => {
      if (
        elem.topicId == parentId &&
        this.FavTabGeoresourceTopicFavItems.includes(parentId)
      )
        ret = true;

      if (elem.subTopics && elem.subTopics.length > 0 && ret === false)
        ret = this.parentInFavRecursive(elem.subTopics, parentId);
    });

    return ret;
  }

  findParentNextRecursive(tree, parent) {
    var parentNext = undefined;
    tree.forEach((elem) => {
      if (elem.topicId == parent) {
        parentNext = elem.parent;
      }

      if (
        elem.subTopics &&
        elem.subTopics.length > 0 &&
        parentNext === undefined
      )
        parentNext = this.findParentNextRecursive(elem.subTopics, parent);
    });

    return parentNext;
  }

  FavTabShowPOIHeader(topic) {
    if (
      topic.poiData.some((e) =>
        this.FavTabPoiFavItems.includes(e.georesourceId),
      ) ||
      topic.aoiData.some((e) =>
        this.FavTabPoiFavItems.includes(e.georesourceId),
      ) ||
      topic.loiData.some((e) =>
        this.FavTabPoiFavItems.includes(e.georesourceId),
      ) ||
      topic.wmsData.some((e) => this.FavTabWmsFavItems.includes(e.id)) ||
      this.topicInFavTopBottom(topic)
    )
      return true;

    return false;
  }

  FavTabShowPoi(topic, georesourceId) {
    if (
      this.FavTabPoiFavItems.includes(georesourceId) ||
      this.topicInFavTopBottom(topic)
    )
      return true;

    return false;
  }

  topicOrGeoresourceInFavRecursive(tree) {
    let ret = false;
    tree.forEach((elem) => {
      if (
        this.FavTabGeoresourceTopicFavItems.includes(elem.topicId) ||
        this.georesourceInFavItems(elem.poiData, this.FavTabPoiFavItems) ||
        this.georesourceInFavItems(elem.aoiData, this.FavTabPoiFavItems) ||
        this.georesourceInFavItems(elem.loiData, this.FavTabPoiFavItems) ||
        this.wmsInFavItems(elem.wmsData, this.FavTabWmsFavItems)
      )
        ret = true;

      if (elem.subTopics && elem.subTopics.length > 0 && ret === false)
        ret = this.topicOrGeoresourceInFavRecursive(elem.subTopics);
    });

    return ret;
  }

  georesourceInFavItems(elems, favItems) {
    return elems.some((e) => favItems.includes(e.georesourceId));
  }

  wmsInFavItems(elems: WmsDataset[], favItems) {
    return elems.some((e) => favItems.includes(e.id));
  }
}
