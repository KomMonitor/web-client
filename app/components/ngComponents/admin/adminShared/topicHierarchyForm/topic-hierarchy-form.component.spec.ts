import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TopicHierarchyFormComponent } from './topic-hierarchy-form.component';
import {
  TopicHierarchyFormGroup,
  TopicNode,
  buildTopicHierarchyForm,
  patchTopicHierarchyFromChain,
} from './topic-hierarchy-form.model';

const SUB_SUB: TopicNode = { topicId: 't-1-1-1', topicName: 'Ebene 3' };
const SUB: TopicNode = { topicId: 't-1-1', topicName: 'Ebene 2', subTopics: [SUB_SUB] };
const MAIN: TopicNode = { topicId: 't-1', topicName: 'Umwelt', subTopics: [SUB] };
const OTHER_MAIN: TopicNode = { topicId: 't-2', topicName: 'Soziales' };

@Component({
  standalone: true,
  imports: [TopicHierarchyFormComponent],
  template: `<app-topic-hierarchy-form
    [form]="form"
    [availableTopics]="topics"
    idPrefix="gr-topics"
  />`,
})
class HostComponent {
  form: TopicHierarchyFormGroup = buildTopicHierarchyForm();
  topics: TopicNode[] = [MAIN, OTHER_MAIN];
}

describe('TopicHierarchyFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const selects = (): HTMLSelectElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('select'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders only the main level while nothing is selected', () => {
    expect(selects()).toHaveLength(1);
    expect(selects()[0].getAttribute('id')).toBe('gr-topics-main');
  });

  it('reveals the next level once a topic with children is picked', () => {
    host.form.controls.mainTopic.setValue(MAIN);
    fixture.detectChanges();

    expect(selects()).toHaveLength(2);
  });

  it('hides deeper levels again when the selection is changed', () => {
    patchTopicHierarchyFromChain(host.form, [MAIN, SUB, SUB_SUB]);
    fixture.detectChanges();
    expect(selects()).toHaveLength(3);

    host.form.controls.mainTopic.setValue(OTHER_MAIN);
    fixture.detectChanges();

    expect(selects()).toHaveLength(1);
  });

  it('shows the required message for the main topic once touched', () => {
    host.form.controls.mainTopic.markAsTouched();
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.help-block.with-errors');
    expect(message.textContent.trim()).toBe('ADMIN_SHARED_UI.VALIDATION.TOPIC_REQUIRED');
  });
});
