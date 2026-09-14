import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TreeGapDirective, TreeNodeFooterDirective, TreeRowDirective } from './tree-row.directive';
import { TreeViewComponent } from './tree-view.component';
import { TreeGap, TreeIndentMode, TreeReorderEvent } from './tree-view.model';

interface TestNode {
  id: string;
  name: string;
  subTopics?: TestNode[];
}

function tree(): TestNode[] {
  return [
    {
      id: 'a',
      name: 'A',
      subTopics: [
        { id: 'a1', name: 'A1', subTopics: [{ id: 'a1x', name: 'A1X' }] },
        { id: 'a2', name: 'A2' },
      ],
    },
    { id: 'b', name: 'B' },
  ];
}

@Component({
  standalone: true,
  imports: [TreeViewComponent, TreeRowDirective],
  template: `
    <app-tree-view
      [nodes]="nodes()"
      [idOf]="idOf"
      [(expandedIds)]="expandedIds"
      [maxDepth]="maxDepth()"
      [indentMode]="indentMode()"
      [reorderable]="reorderable()"
      [insertLabel]="insertLabel()"
      [canInsertAt]="canInsertAt()"
      [toggleOnRowClick]="toggleOnRowClick()"
      (reorder)="lastReorder = $event"
      (insert)="lastInsert = $event"
    >
      <ng-template appTreeRow let-node let-depth="depth">
        <span class="row-label">{{ node.name }}</span>
        <span class="row-depth">{{ depth }}</span>
      </ng-template>
    </app-tree-view>
  `,
})
class HostComponent {
  readonly nodes = signal<TestNode[]>(tree());
  readonly expandedIds = signal<ReadonlySet<string>>(new Set<string>());
  readonly maxDepth = signal<number | null>(null);
  readonly indentMode = signal<TreeIndentMode>('text');
  readonly reorderable = signal(false);
  readonly insertLabel = signal<string | undefined>(undefined);
  readonly canInsertAt = signal<(gap: TreeGap<TestNode>) => boolean>(() => true);
  readonly toggleOnRowClick = signal(false);

  lastReorder: TreeReorderEvent<TestNode> | undefined;
  lastInsert: TreeGap<TestNode> | undefined;

  readonly idOf = (node: TestNode) => node.id;
}

function labels(fixture: ComponentFixture<unknown>): string[] {
  return fixture.debugElement
    .queryAll(By.css('.row-label'))
    .map((el) => el.nativeElement.textContent.trim());
}

describe('TreeViewComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a row per node with the caller row template', () => {
    expect(labels(fixture)).toEqual(['A', 'A1', 'A1X', 'A2', 'B']);
  });

  it('passes the depth into the row context', () => {
    const depths = fixture.debugElement
      .queryAll(By.css('.row-depth'))
      .map((el) => el.nativeElement.textContent.trim());
    expect(depths).toEqual(['0', '1', '2', '1', '0']);
  });

  it('indents the row content and keeps rows full width in text mode', () => {
    const spacers = fixture.debugElement
      .queryAll(By.css('.tree-text-indent'))
      .map((el) => el.nativeElement.style.width);
    expect(spacers.slice(0, 3)).toEqual(['0px', '20px', '40px']);

    const rows = fixture.debugElement.queryAll(By.css('.tree-row'));
    expect(rows.every((el) => el.nativeElement.style.marginLeft === '0px')).toBe(true);
  });

  it('shifts the whole row in row mode', () => {
    host.indentMode.set('row');
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.tree-row'));
    expect(rows[0].nativeElement.style.marginLeft).toBe('0px');
    expect(rows[1].nativeElement.style.marginLeft).toBe('20px');
    expect(rows[2].nativeElement.style.marginLeft).toBe('40px');

    const spacers = fixture.debugElement
      .queryAll(By.css('.tree-text-indent'))
      .map((el) => el.nativeElement.style.width);
    expect(spacers.every((width) => width === '0px')).toBe(true);
  });

  it('tints rows by depth with an accent rail by default', () => {
    const rows = fixture.debugElement.queryAll(By.css('.tree-row'));
    expect(rows[0].nativeElement.classList).toContain('tone-accent-0');
    expect(rows[1].nativeElement.classList).toContain('tone-accent-1');
    expect(rows[2].nativeElement.classList).toContain('tone-accent-2');
  });

  it('shows a drag handle only while reordering is enabled', () => {
    expect(fixture.debugElement.queryAll(By.css('.tree-drag-handle')).length).toBe(0);

    host.reorderable.set(true);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.tree-drag-handle')).length).toBe(5);
  });

  it('exposes tree semantics to assistive technology', () => {
    expect(fixture.debugElement.query(By.css('[role="tree"]'))).not.toBeNull();

    const rows = fixture.debugElement.queryAll(By.css('[role="treeitem"]'));
    expect(rows.length).toBe(5);
    expect(rows[0].nativeElement.getAttribute('aria-level')).toBe('1');
    expect(rows[1].nativeElement.getAttribute('aria-level')).toBe('2');
    expect(rows[0].nativeElement.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles a node on caret click and writes the set back to the host', () => {
    const caret = fixture.debugElement.queryAll(By.css('button.tree-caret'))[0];
    caret.nativeElement.click();
    fixture.detectChanges();

    expect([...host.expandedIds()]).toEqual(['a']);
    expect(
      fixture.debugElement
        .queryAll(By.css('[role="treeitem"]'))[0]
        .nativeElement.getAttribute('aria-expanded')
    ).toBe('true');

    caret.nativeElement.click();
    fixture.detectChanges();
    expect([...host.expandedIds()]).toEqual([]);
  });

  it('gives a leaf a placeholder instead of a caret', () => {
    // 'B' is the last row and has neither children nor a footer template.
    const rows = fixture.debugElement.queryAll(By.css('.tree-row'));
    const leaf = rows[rows.length - 1];

    expect(leaf.query(By.css('button.tree-caret'))).toBeNull();
    expect(leaf.query(By.css('span.tree-caret.placeholder'))).not.toBeNull();
    expect(leaf.nativeElement.getAttribute('aria-expanded')).toBeNull();
  });

  it('keeps collapsed children in the DOM', () => {
    const children = fixture.debugElement.query(By.css('.tree-children'));

    expect(children).not.toBeNull();
    expect(children.nativeElement.classList).toContain('collapse');
    expect(children.nativeElement.classList).not.toContain('show');
    // The rows themselves are rendered, just hidden.
    expect(labels(fixture)).toContain('A1');
  });

  it('declares no display on the collapse target', () => {
    // Checked against the stylesheet, not the DOM: Bootstrap's global CSS is not
    // loaded in the unit environment, so a DOM assertion would pass either way.
    // The invariant lives in the stylesheet — `.collapse:not(.show)` and a
    // component-scoped `.tree-children` carry the same specificity, so a
    // `display` declared here wins on source order and nothing ever collapses.
    const scss = readFileSync(join(__dirname, 'tree-level.component.scss'), 'utf8');
    const fromBlock = scss.slice(scss.indexOf('.tree-children {'));
    const ownDeclarations = fromBlock.slice(0, fromBlock.indexOf('\n}'));

    // Two spaces = a declaration of `.tree-children` itself, deeper = a nested rule.
    expect(ownDeclarations).not.toMatch(/^ {2}display:/m);
  });

  it('stops the recursion at maxDepth', () => {
    host.maxDepth.set(1);
    fixture.detectChanges();

    // Depth 0 and 1 remain, depth 2 ('A1X') is gone entirely.
    expect(labels(fixture)).toEqual(['A', 'A1', 'A2', 'B']);
    expect(fixture.debugElement.queryAll(By.css('.tree-row')).length).toBe(4);

    // 'A1' sits at the limit, so it loses its caret.
    const rows = fixture.debugElement.queryAll(By.css('.tree-row'));
    expect(rows[1].query(By.css('button.tree-caret'))).toBeNull();
  });

  it('disables dragging unless reorderable is set', () => {
    const dropLists = fixture.debugElement.queryAll(By.directive(CdkDropList));
    expect(dropLists.every((el) => el.injector.get(CdkDropList).disabled)).toBe(true);

    host.reorderable.set(true);
    fixture.detectChanges();

    expect(
      fixture.debugElement
        .queryAll(By.directive(CdkDropList))
        .every((el) => el.injector.get(CdkDropList).disabled)
    ).toBe(false);
  });

  it('puts the drag handle only on the live row, never in the preview', () => {
    host.reorderable.set(true);
    fixture.detectChanges();

    // A CdkDragHandle constructed inside the preview would register itself on
    // the very drag it is previewing, so the preview copy must be plain markup.
    const handles = fixture.debugElement.queryAll(By.css('.tree-drag-handle'));
    expect(handles).toHaveLength(5);
    expect(handles.every((el) => el.nativeElement.hasAttribute('cdkdraghandle'))).toBe(true);
  });

  it('reports a drop without mutating the bound array', () => {
    host.reorderable.set(true);
    fixture.detectChanges();

    const before = host.nodes();
    const rootList = fixture.debugElement
      .queryAll(By.directive(CdkDropList))[0]
      .injector.get(CdkDropList);

    rootList.dropped.emit({
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<unknown>);
    fixture.detectChanges();

    expect(host.lastReorder?.parent).toBeNull();
    expect(host.lastReorder?.previousIndex).toBe(0);
    expect(host.lastReorder?.currentIndex).toBe(1);
    expect(host.lastReorder?.nodes.map((n) => n.id)).toEqual(['b', 'a']);

    // The component reports, the host decides — nothing moved on its own.
    expect(host.nodes()).toBe(before);
    expect(host.nodes().map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('ignores a drop that changes nothing', () => {
    host.reorderable.set(true);
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.directive(CdkDropList))[0]
      .injector.get(CdkDropList)
      .dropped.emit({ previousIndex: 1, currentIndex: 1 } as CdkDragDrop<unknown>);

    expect(host.lastReorder).toBeUndefined();
  });

  it('renders no insert lines without an insertLabel', () => {
    expect(fixture.debugElement.queryAll(By.css('.tree-insert')).length).toBe(0);
  });

  it('renders one insert line per gap plus one at the end', () => {
    host.insertLabel.set('einfügen');
    fixture.detectChanges();

    // Root level has 2 siblings → 3 lines. Each rendered child level adds its own,
    // so scope the query to the root level's own children.
    const rootLevel: HTMLElement = fixture.debugElement.query(
      By.css('.tree-view > app-tree-level > .tree-level')
    ).nativeElement;
    const rootLines = Array.from(rootLevel.querySelectorAll<HTMLElement>(':scope > .tree-insert'));
    expect(rootLines.length).toBe(3);

    rootLines[2].click();
    expect(host.lastInsert).toEqual({ parent: null, index: 2 });

    rootLines[0].click();
    expect(host.lastInsert).toEqual({ parent: null, index: 0 });
  });

  it('hides the gaps the caller rejects', () => {
    host.insertLabel.set('einfügen');
    fixture.detectChanges();
    const allLines = fixture.debugElement.queryAll(By.css('.tree-insert')).length;

    // Only the leading gap of each level — the rule a linear chain needs.
    host.canInsertAt.set((gap) => gap.index === 0);
    fixture.detectChanges();

    const leadingLines = fixture.debugElement.queryAll(By.css('.tree-insert'));
    expect(leadingLines.length).toBeLessThan(allLines);
    // Root, A's children, A1's children, A1X's (empty) children, A2's (empty) children, B's.
    expect(leadingLines.length).toBe(6);

    leadingLines[0].nativeElement.click();
    expect(host.lastInsert).toEqual({ parent: null, index: 0 });
  });

  it('toggles on a row click only when asked to', () => {
    const row = fixture.debugElement.queryAll(By.css('.tree-row'))[0];

    row.nativeElement.click();
    fixture.detectChanges();
    expect([...host.expandedIds()]).toEqual([]);

    host.toggleOnRowClick.set(true);
    fixture.detectChanges();

    row.nativeElement.click();
    fixture.detectChanges();
    expect([...host.expandedIds()]).toEqual(['a']);
  });
});

@Component({
  standalone: true,
  imports: [TreeViewComponent, TreeRowDirective, TreeNodeFooterDirective],
  template: `
    <app-tree-view [nodes]="nodes" [idOf]="idOf">
      <ng-template appTreeRow let-node>
        <span class="row-label">{{ node.name }}</span>
      </ng-template>
      <ng-template appTreeNodeFooter let-node>
        <span class="node-footer">add under {{ node.name }}</span>
      </ng-template>
    </app-tree-view>
  `,
})
class FooterHostComponent {
  readonly nodes: TestNode[] = [{ id: 'leaf', name: 'Leaf' }];
  readonly idOf = (node: TestNode) => node.id;
}

describe('TreeViewComponent with a node footer', () => {
  let fixture: ComponentFixture<FooterHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FooterHostComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(FooterHostComponent);
    fixture.detectChanges();
  });

  it('makes a childless node expandable and renders the footer under it', () => {
    const caret = fixture.debugElement.query(By.css('button.tree-caret'));
    expect(caret).not.toBeNull();

    expect(fixture.debugElement.query(By.css('.node-footer')).nativeElement.textContent).toContain(
      'add under Leaf'
    );
  });
});

@Component({
  standalone: true,
  imports: [TreeViewComponent, TreeRowDirective, TreeGapDirective],
  template: `
    <app-tree-view
      [nodes]="nodes"
      [idOf]="idOf"
      insertLabel="einfügen"
      [(openGap)]="openGap"
      (insert)="lastInsert = $event"
    >
      <ng-template appTreeRow let-node>
        <span class="row-label">{{ node.name }}</span>
      </ng-template>
      <ng-template appTreeGap let-gap let-close="close">
        <span class="gap-panel">{{ gap.parent?.name ?? 'root' }}/{{ gap.index }}</span>
        <button type="button" class="gap-close" (click)="close()">x</button>
      </ng-template>
    </app-tree-view>
  `,
})
class GapHostComponent {
  readonly nodes: TestNode[] = tree();
  readonly openGap = signal<TreeGap<TestNode> | null>(null);
  lastInsert: TreeGap<TestNode> | undefined;
  readonly idOf = (node: TestNode) => node.id;
}

describe('TreeViewComponent with a gap slot', () => {
  let fixture: ComponentFixture<GapHostComponent>;
  let host: GapHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GapHostComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(GapHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens the slot at the clicked gap instead of emitting insert', () => {
    const linesBefore = fixture.debugElement.queryAll(By.css('.tree-insert')).length;

    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(host.lastInsert).toBeUndefined();
    expect(host.openGap()).toEqual({ parent: null, index: 0 });

    const panels = fixture.debugElement.queryAll(By.css('.gap-panel'));
    expect(panels).toHaveLength(1);
    expect(panels[0].nativeElement.textContent.trim()).toBe('root/0');
    // The slot replaces exactly the clicked line; the other gaps stay lines.
    expect(fixture.debugElement.queryAll(By.css('.tree-insert')).length).toBe(linesBefore - 1);
  });

  it('passes the parent of a nested gap into the context', () => {
    // The second line of the root level sits inside the children of 'A'.
    fixture.debugElement.queryAll(By.css('.tree-insert'))[1].nativeElement.click();
    fixture.detectChanges();

    expect(host.openGap()?.parent?.id).toBe('a');
    expect(fixture.debugElement.query(By.css('.gap-panel')).nativeElement.textContent.trim()).toBe(
      'A/0'
    );
  });

  it('closes the slot through the context callback', () => {
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.gap-close')).nativeElement.click();
    fixture.detectChanges();

    expect(host.openGap()).toBeNull();
    expect(fixture.debugElement.query(By.css('.gap-panel'))).toBeNull();
  });

  it('lets the host open a slot on its own', () => {
    host.openGap.set({ parent: null, index: 2 });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.gap-panel')).nativeElement.textContent.trim()).toBe(
      'root/2'
    );
  });

  it('opens only one slot at a time', () => {
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.gap-panel'))).toHaveLength(1);
  });
});
