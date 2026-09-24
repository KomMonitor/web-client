import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

export type ExpanableBoxBorderColor = 'primary' | 'red' | 'green' | 'cyan';

/** 'nested' subordinates a box that sits inside another box's body. */
export type ExpandableBoxVariant = 'default' | 'nested';

@Component({
  selector: 'expandable-box',
  templateUrl: './expandable-box.component.html',
  styleUrls: ['./expandable-box.component.scss'],
  imports: [NgbCollapseModule],
  standalone: true,
})
export class ExpandableBoxComponent implements OnInit {
  @Input({ required: true }) title!: string;
  @Input() collapsed: boolean = true;
  @Input() borderColor: ExpanableBoxBorderColor = 'primary';
  @Input() isCollapsible: boolean = true;
  @Input() variant: ExpandableBoxVariant = 'default';

  /**
   * Fires on every manual toggle, so a host can react to the box opening —
   * loading its content only then, for instance. Named to match `collapsed`,
   * which also makes `[(collapsed)]` work.
   */
  @Output() collapsedChange = new EventEmitter<boolean>();

  ngOnInit() {
    if (this.isCollapsible === false) {
      this.collapsed = false;
    }
  }

  onCollapseToggle() {
    if (this.isCollapsible) {
      this.collapsed = !this.collapsed;
      this.collapsedChange.emit(this.collapsed);
    }
  }

  /** Space activates the header like a button, without scrolling the page. */
  onSpace(event: Event) {
    if (!this.isCollapsible) {
      return;
    }
    event.preventDefault();
    this.onCollapseToggle();
  }
}
