import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

export interface dualListInput {
  items: item[];
  selectedItems: item[];
}

export interface item {
  name: string;
  id: any;
}

@Component({
  selector: 'app-dual-list-box',
  standalone: true,
  templateUrl: './dual-list-box.component.html',
  styleUrls: ['./dual-list-box.component.css'],
  imports: [CommonModule]
})
export class DualListBoxComponent implements OnInit, OnChanges {

  @Input() data!:dualListInput;
  @Input() reload:boolean = false;
  
  @Output() selectedItems = new EventEmitter<any>();

  selectSize: number = 5;
  availableElements: item[] = [];
  displayedAvailableElements: item[] = [];

  selectedElements: item[] = [];
  displayedSelectedElements: item[] = [];

  ngOnInit(): void {
    this.availableElements = this.prepAvailableItemsOnSetup();
    this.displayedAvailableElements = this.availableElements;
    this.selectedElements = this.data.selectedItems;
    this.displayedSelectedElements = this.data.selectedItems;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.availableElements = this.prepAvailableItemsOnSetup();
    this.displayedAvailableElements = this.availableElements;
    this.selectedElements = this.data.selectedItems;
    this.displayedSelectedElements = this.data.selectedItems;
  }

  prepAvailableItemsOnSetup(): item[] {

    let selectedItemNames = this.data.selectedItems.map(e => e.name);

    return this.data.items.filter(elem => !selectedItemNames.includes(elem.name));
  }

  onAvailableElementClick(elem:item) {
    this.selectedElements.push(elem);
    this.displayedSelectedElements = this.selectedElements;

    this.availableElements = this.availableElements.filter(e => e.id!=elem.id);
    this.displayedAvailableElements = this.availableElements;

    this.updateSelectedElements();
  } 

  onSelectedElementClick(elem:item) {
    this.availableElements.push(elem);
    this.displayedAvailableElements = this.availableElements;

    this.selectedElements = this.selectedElements.filter(e => e.id!=elem.id);
    this.displayedSelectedElements = this.selectedElements;
    
    this.updateSelectedElements();
  }

  onAvailableSearchChange(event:any) {
    let value = event.target.value;
    
    this.displayedAvailableElements = this.availableElements.filter(e => e.name.includes(value));
  }

  onSelectedSearchChange(event:any) {
    let value = event.target.value;

    this.displayedSelectedElements = this.selectedElements.filter(e => e.name.includes(value));
  }

  updateSelectedElements() {
    this.selectedItems.emit(this.selectedElements);
  }
}
