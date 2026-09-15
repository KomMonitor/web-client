import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { NotificationService } from '../../../common/notification/notification.service';
import { AddTopicComponent } from '../add-topic/add-topic.component';
import { TreeViewComponent } from '../../../common/tree-view/tree-view.component';
import { AdminTopicsManagementErrorHandlingService } from '../admin-topics-management-error-handling.service';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { Topic } from '../topic.model';
import { TopicTreeComponent } from './topic-tree.component';

function topic(name: string, displayOrder: number, subTopics: Topic[] = []): Topic {
  return {
    topicId: name.toLowerCase(),
    topicName: name,
    topicDescription: `${name} description`,
    topicType: subTopics.length ? 'main' : 'sub',
    topicResource: 'indicator',
    displayOrder,
    subTopics,
  };
}

function texts(fixture: ComponentFixture<unknown>, selector: string): string[] {
  return fixture.debugElement
    .queryAll(By.css(selector))
    .map((el) => el.nativeElement.textContent.trim());
}

describe('TopicTreeComponent', () => {
  let fixture: ComponentFixture<TopicTreeComponent>;
  let notificationService: NotificationService;
  let srvc: {
    updateMainTopicOrder: jest.Mock<Observable<unknown>>;
    updateSubTopicOrder: jest.Mock<Observable<unknown>>;
  };

  let zuzug: Topic;
  let population: Topic;
  let education: Topic;

  beforeEach(() => {
    zuzug = topic('Zuzug', 0);
    population = topic('Bevoelkerung', 0, [zuzug]);
    education = topic('Bildung', 1);

    srvc = {
      updateMainTopicOrder: jest.fn(() => of({})),
      updateSubTopicOrder: jest.fn(() => of({})),
    };

    TestBed.configureTestingModule({
      imports: [TopicTreeComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AdminTopicsManagementService, useValue: srvc },
        AdminTopicsManagementErrorHandlingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    });

    fixture = TestBed.createComponent(TopicTreeComponent);
    fixture.componentRef.setInput('topics', [population, education]);
    fixture.componentRef.setInput('topicResourceType', 'indicator');
    fixture.componentRef.setInput('order', 'custom');
  });

  /** The caret of the row at `rowIndex`, or null for a row that cannot be opened. */
  function caret(rowIndex: number): HTMLButtonElement | null {
    const row = fixture.debugElement.queryAll(By.css('.tree-row'))[rowIndex];
    return row.query(By.css('button.tree-caret'))?.nativeElement ?? null;
  }

  /**
   * The "append subtopic" link at `linkIndex` in render order — a node's link sits
   * below its children, so the order here is Zuzug, Bevoelkerung, Bildung.
   */
  function appendLink(linkIndex: number): HTMLButtonElement {
    return fixture.debugElement.queryAll(By.css('.topic-append'))[linkIndex].nativeElement;
  }

  function treeView(): TreeViewComponent<Topic> {
    return fixture.debugElement.query(By.directive(TreeViewComponent)).componentInstance;
  }

  it('renders the whole hierarchy in its display order', () => {
    fixture.detectChanges();

    expect(texts(fixture, '.topic-name')).toEqual(['Bevoelkerung', 'Zuzug', 'Bildung']);
  });

  it('keeps the subtopics closed until their topic is opened', () => {
    fixture.detectChanges();
    // The rows stay in the DOM either way; the collapse is what hides them.
    expect(caret(0)!.getAttribute('aria-expanded')).toBe('false');

    caret(0)!.click();
    fixture.detectChanges();

    expect(caret(0)!.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens a topic on a click anywhere in its row, as the old list did', () => {
    fixture.detectChanges();

    fixture.debugElement.queryAll(By.css('.tree-row'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(caret(0)!.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows the subtopic count of a topic that has children', () => {
    fixture.detectChanges();

    expect(texts(fixture, '.topic-meta')).toEqual(['ADMIN_TOPICS.SUBTOPIC_COUNT_ONE']);
  });

  it('shows the topic ids only when asked to', () => {
    fixture.detectChanges();
    expect(texts(fixture, '.topic-id')).toEqual([]);

    fixture.componentRef.setInput('showTopicIds', true);
    fixture.detectChanges();

    expect(texts(fixture, '.topic-id')).toEqual(['bevoelkerung', 'zuzug', 'bildung']);
  });

  it('offers drag handles only in the custom order mode', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.tree-drag-handle')).length).toBe(3);

    fixture.componentRef.setInput('order', 'alphabetical');
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.tree-drag-handle')).length).toBe(0);
  });

  it('persists a reordering of the main topics and shows it right away', () => {
    fixture.detectChanges();

    treeView().reorder.emit({
      parent: null,
      previousIndex: 1,
      currentIndex: 0,
      nodes: [education, population],
    });
    fixture.detectChanges();

    expect(srvc.updateMainTopicOrder).toHaveBeenCalledWith('indicator', [education, population]);
    expect([education.displayOrder, population.displayOrder]).toEqual([0, 1]);
    expect(texts(fixture, '.topic-name')).toEqual(['Bildung', 'Bevoelkerung', 'Zuzug']);
  });

  it('persists a reordering of subtopics against their parent', () => {
    const wegzug = topic('Wegzug', 1);
    population.subTopics!.push(wegzug);
    fixture.detectChanges();

    treeView().reorder.emit({
      parent: population,
      previousIndex: 1,
      currentIndex: 0,
      nodes: [wegzug, zuzug],
    });

    expect(srvc.updateSubTopicOrder).toHaveBeenCalledWith(population, [wegzug, zuzug]);
    expect(srvc.updateMainTopicOrder).not.toHaveBeenCalled();
    expect([wegzug.displayOrder, zuzug.displayOrder]).toEqual([0, 1]);
  });

  it('restores the previous order when saving it fails', () => {
    notificationService = TestBed.inject(NotificationService);
    const showError = jest.spyOn(notificationService, 'showError').mockImplementation(() => {});
    srvc.updateMainTopicOrder.mockReturnValue(throwError(() => new Error('nope')));
    fixture.detectChanges();

    treeView().reorder.emit({
      parent: null,
      previousIndex: 1,
      currentIndex: 0,
      nodes: [education, population],
    });
    fixture.detectChanges();

    expect([population.displayOrder, education.displayOrder]).toEqual([0, 1]);
    expect(texts(fixture, '.topic-name')).toEqual(['Bevoelkerung', 'Zuzug', 'Bildung']);
    expect(showError).toHaveBeenCalled();
  });

  it('offers the append link, not a form, inside every topic that may take children', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.topic-append')).length).toBe(3);
    expect(fixture.debugElement.queryAll(By.css('app-admin-add-topic')).length).toBe(0);
  });

  it('opens the add panel of the clicked topic only, and closes it again', () => {
    fixture.detectChanges();

    appendLink(1).click();
    fixture.detectChanges();

    const panels = fixture.debugElement.queryAll(By.css('.topic-add-panel'));
    expect(panels.length).toBe(1);
    expect(panels[0].query(By.directive(AddTopicComponent)).componentInstance.parentTopic).toBe(
      population
    );

    panels[0].query(By.css('.btn-link')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.topic-add-panel')).length).toBe(0);
    expect(fixture.debugElement.queryAll(By.css('.topic-append')).length).toBe(3);
  });

  it('closes the add panel once the subtopic has been created', () => {
    fixture.detectChanges();
    appendLink(1).click();
    fixture.detectChanges();

    fixture.debugElement.query(By.directive(AddTopicComponent)).componentInstance.added.emit();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.topic-add-panel')).length).toBe(0);
  });

  it('offers exactly one insert line, at the end of the main topics', () => {
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css('.tree-insert'));
    expect(lines.length).toBe(1);
    // Last element of the root level, so after the last main topic's own footer.
    const rootLevel = fixture.debugElement.query(By.css('.tree-view > app-tree-level .tree-level'));
    expect(rootLevel.nativeElement.lastElementChild).toBe(lines[0].nativeElement);
  });

  it('adds a main topic from the panel of that line', () => {
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.tree-insert')).nativeElement.click();
    fixture.detectChanges();

    const panel = fixture.debugElement.query(By.css('.tree-gap .topic-add-panel'));
    const form = panel.query(By.directive(AddTopicComponent)).componentInstance;
    expect(form.topicType).toBe('main');
    expect(form.parentTopic).toBeUndefined();

    panel.query(By.css('.topic-add-cancel')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.tree-gap'))).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('.tree-insert')).length).toBe(1);
  });

  it('closes the main topic panel once the topic has been created', () => {
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.tree-insert')).nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('.tree-gap'))
      .query(By.directive(AddTopicComponent))
      .componentInstance.added.emit();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.tree-gap'))).toBeNull();
  });

  it('stops at the level limit, so the deepest topics take no children', () => {
    fixture.componentRef.setInput('levelLimit', 2);
    fixture.detectChanges();

    // Row 1 is the subtopic: at the limit it has neither a caret nor an add form.
    expect(caret(1)).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('.topic-append')).length).toBe(2);
  });
});
