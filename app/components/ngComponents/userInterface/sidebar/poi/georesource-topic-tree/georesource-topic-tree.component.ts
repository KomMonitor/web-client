import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from 'components/ngComponents/models/georesources.models';
import { GeoresourceDatasetTableComponent } from '../georesource-dataset-table/georesource-dataset-table.component';

/**
 * Renders the georesource topic hierarchy recursively (arbitrary depth) instead
 * of the previously hand-unrolled four levels. Each node shows a collapsible
 * header and, when it carries own datasets, the shared
 * {@link GeoresourceDatasetTableComponent}.
 *
 * Collapse state is owned by this component (mirroring the indicators
 * `app-topic-tree`); topic/dataset side effects are delegated to the parent via
 * outputs.
 */
@Component({
  selector: 'app-georesource-topic-tree',
  templateUrl: './georesource-topic-tree.component.html',
  styleUrls: ['./georesource-topic-tree.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, GeoresourceDatasetTableComponent],
})
export class GeoresourceTopicTreeComponent implements OnChanges {
  @Input() topics: GeoresourcesTopicsHierarchy[] = [];
  @Input() showFavSelection = false;
  @Input() showPerDatasetDateColumn = true;
  @Input() topicFavItems: string[] = [];
  @Input() poiFavItems: string[] = [];
  @Input() wmsFavItems: string[] = [];

  @Output() showAllOnTopic = new EventEmitter<GeoresourcesTopicsHierarchy>();
  @Output() topicFavToggled = new EventEmitter<string>();
  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() toggleWmsOnMap = new EventEmitter<any>();
  @Output() toggleWfsOnMap = new EventEmitter<any>();
  @Output() selectedDateChange = new EventEmitter<GeoresourcesDataset>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();
  @Output() exportGeoresource = new EventEmitter<GeoresourcesDataset>();
  @Output() poiFavToggled = new EventEmitter<string | null | undefined>();
  @Output() wmsFavToggled = new EventEmitter<string | null | undefined>();
  @Output() wfsColorChange = new EventEmitter<any>();

  collapsedTopicIds: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['topics']) {
      this.collapsedTopicIds = [];
      this.initCollapsedState(this.topics);
    }
  }

  onTopicClick(topicId: string): void {
    if (this.collapsedTopicIds.includes(topicId)) {
      this.collapsedTopicIds = this.collapsedTopicIds.filter((e) => e !== topicId);
    } else {
      this.collapsedTopicIds.push(topicId);
    }
  }

  isTopicFav(topicId: string): boolean {
    return this.topicFavItems.includes(topicId);
  }

  /** The styled hierarchy levels only go up to 3; deeper nodes reuse level 3. */
  styleLevel(level: number): number {
    return Math.min(level, 3);
  }

  /** True if the topic or any of its descendants has a selected dataset. */
  checkHierarchyPoiSelected(topic: GeoresourcesTopicsHierarchy): boolean {
    if (
      topic.poiData.some((e) => e.isSelected === true) ||
      topic.aoiData.some((e) => e.isSelected === true) ||
      topic.loiData.some((e) => e.isSelected === true) ||
      topic.wmsData.some((e: any) => e.isSelected === true)
    ) {
      return true;
    }
    return topic.subTopics.some((sub) => this.checkHierarchyPoiSelected(sub));
  }

  private initCollapsedState(topics: GeoresourcesTopicsHierarchy[]): void {
    if (!topics) {
      return;
    }
    topics.forEach((topic) => {
      this.collapsedTopicIds.push(topic.topicId);
      if (topic.subTopics?.length > 0) {
        this.initCollapsedState(topic.subTopics);
      }
    });
  }
}
