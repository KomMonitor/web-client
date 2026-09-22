import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';

import { TopicElementComponent } from './topic-element.component';

function makeTopic(overrides: Partial<IndicatorsTopicsHierarchy> = {}): IndicatorsTopicsHierarchy {
  return {
    indicatorCount: 0,
    indicatorData: [],
    subTopics: [],
    level: 0,
    parent: undefined,
    topicDescription: 'Beschreibung',
    topicId: 'topic-1',
    topicName: 'Stadt Essen',
    topicResource: '',
    topicType: '',
    displayOrder: 0,
    wmsData: [],
    wmsCount: 0,
    ...overrides,
  };
}

describe('TopicElementComponent', () => {
  let fixture: ComponentFixture<TopicElementComponent>;
  let component: TopicElementComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TopicElementComponent] });
    fixture = TestBed.createComponent(TopicElementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('topic', makeTopic());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    fixture.componentRef.setInput('topic', makeTopic());
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.topic-element__title')).nativeElement.textContent.trim()
    ).toBe('Stadt Essen');
  });

  it('disables the toggle and hides the caret when the topic has no children', () => {
    fixture.componentRef.setInput('topic', makeTopic());
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.topic-element__caret'))).toBeNull();
    expect(
      fixture.debugElement.query(By.css('.topic-element__toggle')).nativeElement.disabled
    ).toBe(true);
  });

  it('emits toggleCollapse when the row is clicked and a child exists', () => {
    let emitted = 0;
    component.toggleCollapse.subscribe(() => emitted++);
    fixture.componentRef.setInput(
      'topic',
      makeTopic({ subTopics: [makeTopic({ topicId: 'child' })] })
    );
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.topic-element__toggle')).nativeElement.click();
    expect(emitted).toBe(1);
  });

  it('projects nested content only while expanded', () => {
    fixture.componentRef.setInput(
      'topic',
      makeTopic({ subTopics: [makeTopic({ topicId: 'child' })] })
    );
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.topic-element__children'))).toBeNull();

    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.topic-element__children'))).not.toBeNull();
  });

  it('shows the favourite star only when enabled, and emits favToggled on click', () => {
    let emitted = 0;
    component.favToggled.subscribe(() => emitted++);
    fixture.componentRef.setInput('topic', makeTopic());
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.topic-element__fav'))).toBeNull();

    fixture.componentRef.setInput('showFavSelection', true);
    fixture.detectChanges();
    const star = fixture.debugElement.query(By.css('.topic-element__fav'));
    expect(star.nativeElement.classList).toContain('fa-regular');

    star.nativeElement.click();
    expect(emitted).toBe(1);

    fixture.componentRef.setInput('isFavorite', true);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.topic-element__fav')).nativeElement.classList
    ).toContain('fa-solid');
  });

  it('uses the solid "-selected" level color when it contains the selected indicator', () => {
    fixture.componentRef.setInput('topic', makeTopic());
    fixture.componentRef.setInput('level', 1);
    fixture.detectChanges();
    let row = fixture.debugElement.query(By.css('.topic-element__row'))
      .nativeElement as HTMLElement;
    expect(row.style.backgroundColor).toBe('var(--kommonitor-hierarchy-level-1)');

    fixture.componentRef.setInput('containsSelectedIndicator', true);
    fixture.detectChanges();
    row = fixture.debugElement.query(By.css('.topic-element__row')).nativeElement as HTMLElement;
    expect(row.style.backgroundColor).toBe('var(--kommonitor-hierarchy-level-1-selected)');
  });
});
