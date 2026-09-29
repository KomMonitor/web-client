import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { Topic } from '../topic.model';

import { TopicEditModalComponent } from './topic-edit-modal.component';

/**
 * Covers the always-active submit button: an incomplete form is not sent but
 * shows its errors and focuses the first invalid field, a complete one is sent.
 * The topic tree opens the modal with the topic as its only input.
 */

const TOPIC = {
  topicId: 't-1',
  topicName: 'Umwelt',
  topicDescription: 'Umweltthemen',
  topicType: 'main',
  topicResource: 'indicator',
  subTopics: [],
} as unknown as Topic;

describe('TopicEditModalComponent', () => {
  let component: TopicEditModalComponent;
  let fixture: ComponentFixture<TopicEditModalComponent>;
  let editTopic: jest.Mock;
  let close: jest.Mock;

  const submitButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.modal-footer .btn-success');
  const errorMessages = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('app-form-error .with-errors'));

  beforeEach(() => {
    editTopic = jest.fn().mockReturnValue(of({}));
    close = jest.fn();

    TestBed.configureTestingModule({
      imports: [TopicEditModalComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NgbActiveModal, useValue: { close, dismiss: jest.fn() } },
        { provide: AdminTopicsManagementService, useValue: { editTopic } },
        {
          provide: NotificationService,
          useValue: { showSuccess: jest.fn(), showError: jest.fn() },
        },
      ],
    });

    fixture = TestBed.createComponent(TopicEditModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('topic', TOPIC);
    // Attached to the document so that focus() actually moves the focus.
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('seeds the form from the topic', () => {
    expect(component.topicForm.getRawValue()).toEqual({
      name: 'Umwelt',
      description: 'Umweltthemen',
    });
  });

  it('keeps the button enabled but does not submit an incomplete form', () => {
    component.topicForm.controls.name.setValue('');
    fixture.detectChanges();

    expect(submitButton().disabled).toBe(false);
    submitButton().click();
    fixture.detectChanges();

    expect(editTopic).not.toHaveBeenCalled();
    expect(errorMessages()).toHaveLength(1);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#topic-name-input'));
  });

  it('treats whitespace-only values as missing', () => {
    component.topicForm.setValue({ name: '   ', description: ' \n ' });
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(editTopic).not.toHaveBeenCalled();
    expect(errorMessages()).toHaveLength(2);
    expect(component.topicForm.controls.description.hasError('required')).toBe(true);
  });

  it('focuses the description when only that one is missing', () => {
    component.topicForm.controls.description.setValue('');
    fixture.detectChanges();

    submitButton().click();

    expect(editTopic).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('#topic-description-input')
    );
  });

  it('submits a complete form and closes the modal', () => {
    component.topicForm.setValue({ name: 'Klima', description: 'Klimathemen' });
    fixture.detectChanges();

    submitButton().click();

    expect(editTopic).toHaveBeenCalledWith(TOPIC, 'Klima', 'Klimathemen');
    expect(close).toHaveBeenCalledWith(true);
  });
});
