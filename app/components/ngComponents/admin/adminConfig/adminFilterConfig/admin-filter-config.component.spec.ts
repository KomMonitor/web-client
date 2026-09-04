import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { of } from 'rxjs';

import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { AdminFilterConfigComponent } from './admin-filter-config.component';

describe('AdminFilterConfigComponent', () => {
  let component: AdminFilterConfigComponent;
  let fixture: ComponentFixture<AdminFilterConfigComponent>;
  let storedConfig: any[];
  let postedConfig: string | undefined;

  // Deletion asks <app-admin-filter-delete-modal> for confirmation, so the
  // dialog stands in for the former window.confirm(): `confirmResult` is what
  // its `result` promise settles with — resolve(true) for "delete", reject for
  // a dismissal (Esc, backdrop, cancel).
  let confirmResult: Promise<unknown>;
  let modalStub: { open: jest.Mock };

  beforeEach(() => {
    storedConfig = [];
    postedConfig = undefined;
    confirmResult = Promise.resolve(true);
    modalStub = {
      open: jest.fn(() => ({ componentInstance: {} as any, result: confirmResult })),
    };

    TestBed.configureTestingModule({
      imports: [AdminFilterConfigComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: NgbModal, useValue: modalStub },
        {
          provide: ConfigStorageService,
          useValue: {
            getFilterConfig: () => of(storedConfig),
            postFilterConfig: (jsonString: string) => {
              postedConfig = jsonString;
              return of('ok');
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminFilterConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('prepGlobalFilterData', () => {
    beforeEach(() => {
      TestBed.inject(IndicatorMetadataStoreService).availableIndicators = [
        { indicatorId: 'i-1', indicatorName: 'Einwohner Essen' },
      ] as any;
      TestBed.inject(GeoresourceMetadataStoreService).availableGeoresources = [
        { georesourceId: 'g-1', datasetName: 'Schulstandorte' },
      ] as any;
      TestBed.inject(TopicMetadataStoreService).availableTopics = [
        {
          topicId: 't-main',
          topicName: 'Bildung',
          topicResource: 'indicator',
          subTopics: [{ topicId: 't-sub', topicName: 'Schulen', subTopics: [] }],
        },
        {
          topicId: 'g-main',
          topicName: 'Infrastruktur',
          topicResource: 'georesource',
          subTopics: [],
        },
      ] as any;
    });

    it('resolves the stored ids to the names the table shows', () => {
      component.origConfig = [
        {
          name: 'Schulung',
          indicators: ['i-1'],
          indicatorTopics: ['t-sub'],
          georesources: ['g-1'],
          georesourceTopics: ['g-main'],
        },
      ];

      component.prepGlobalFilterData();

      expect(component.mergedFilterConfig).toEqual([
        {
          name: 'Schulung',
          filterId: 0,
          indicators: ['Einwohner Essen'],
          indicatorTopics: ['Schulen'],
          georesources: ['Schulstandorte'],
          georesourceTopics: ['Infrastruktur'],
        },
      ]);
    });

    it('leaves the stored configuration untouched, so it can run repeatedly', () => {
      component.origConfig = [
        {
          name: 'Schulung',
          indicators: ['i-1'],
          indicatorTopics: [],
          georesources: [],
          georesourceTopics: [],
        },
      ];

      component.prepGlobalFilterData();
      component.prepGlobalFilterData();

      expect(component.origConfig[0].indicators).toEqual(['i-1']);
      expect(component.mergedFilterConfig[0].indicators).toEqual(['Einwohner Essen']);
    });

    it('renders an unknown id as an empty cell entry', () => {
      component.origConfig = [
        {
          name: 'Schulung',
          indicators: ['does-not-exist'],
          indicatorTopics: [],
          georesources: [],
          georesourceTopics: [],
        },
      ];

      component.prepGlobalFilterData();

      expect(component.mergedFilterConfig[0].indicators).toEqual([undefined]);
    });
  });

  describe('onGlobalFilterDelete', () => {
    beforeEach(() => {
      storedConfig = [{ name: 'first' }, { name: 'second' }, { name: 'third' }];
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('removes the entry at the given position after confirmation', async () => {
      await component.onGlobalFilterDelete(1);

      expect(JSON.parse(postedConfig!)).toEqual([{ name: 'first' }, { name: 'third' }]);
    });

    it('hands the entry to the confirmation dialog', async () => {
      const instance: any = { componentInstance: {}, result: confirmResult };
      modalStub.open.mockReturnValue(instance);

      await component.onGlobalFilterDelete(1);

      expect(modalStub.open).toHaveBeenCalled();
      expect(instance.componentInstance.filter).toEqual({ name: 'second' });
    });

    it('keeps the configuration when the dialog is dismissed', async () => {
      confirmResult = Promise.reject('cancel');

      await component.onGlobalFilterDelete(1);

      expect(postedConfig).toBeUndefined();
    });

    it('keeps the configuration when the dialog closes without confirming', async () => {
      confirmResult = Promise.resolve(false);

      await component.onGlobalFilterDelete(1);

      expect(postedConfig).toBeUndefined();
    });

    it('ignores an index that no longer exists', async () => {
      await component.onGlobalFilterDelete(7);

      expect(modalStub.open).not.toHaveBeenCalled();
      expect(postedConfig).toBeUndefined();
    });

    it('clears the grid once the last filter is gone', async () => {
      storedConfig = [{ name: 'only one' }];
      const notificationService = TestBed.inject(NotificationService);
      jest.spyOn(notificationService, 'showSuccess');

      await component.onGlobalFilterDelete(0);
      // refreshAdminFilterOverview() re-reads the stored config; the stub still
      // serves the pre-delete array, so drive the empty state explicitly
      component.origConfig = [];
      component.initializeOrRefreshOverviewTable();

      expect(JSON.parse(postedConfig!)).toEqual([]);
      expect(component.rowData()).toEqual([]);
      expect(component.loadingData).toBe(false);
      expect(notificationService.showSuccess).toHaveBeenCalled();
    });
  });
});
