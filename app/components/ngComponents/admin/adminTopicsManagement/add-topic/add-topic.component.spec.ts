import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { AdminTopicsManagementErrorHandlingService } from '../admin-topics-management.component';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';

import { AddTopicComponent } from './add-topic.component';

describe('AddTopicComponent', () => {
  let component: AddTopicComponent;
  let fixture: ComponentFixture<AddTopicComponent>;
  let addTopic: jest.Mock;

  beforeEach(() => {
    addTopic = jest.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      imports: [AddTopicComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminTopicsManagementService, useValue: { addTopic } },
        { provide: AdminTopicsManagementErrorHandlingService, useValue: {} },
        { provide: IndicatorValueService, useValue: { syntaxHighlightJSON: () => '' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(AddTopicComponent);
    component = fixture.componentInstance;
    component.topicResourceType = 'indicator' as never;
    component.topicType = 'main';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('needs both a title and a description before the add button opens', () => {
    expect(component.form.invalid).toBe(true);

    component.form.controls.title.setValue('Umwelt');
    expect(component.form.invalid).toBe(true);

    component.form.controls.description.setValue('Beschreibung');
    expect(component.form.valid).toBe(true);
  });

  it('passes the entered values to the service', () => {
    component.form.setValue({ title: 'Umwelt', description: 'Beschreibung' });

    component.onAddTopic();

    expect(addTopic).toHaveBeenCalledWith('main', 'indicator', 'Umwelt', 'Beschreibung', undefined);
  });

  it('clears the form after a successful add', () => {
    component.form.setValue({ title: 'Umwelt', description: 'Beschreibung' });

    component.onAddTopic();

    expect(component.form.getRawValue()).toEqual({ title: '', description: '' });
  });
});
