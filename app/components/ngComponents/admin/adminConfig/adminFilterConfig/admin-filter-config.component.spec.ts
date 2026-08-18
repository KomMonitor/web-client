import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

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

  beforeEach(() => {
    storedConfig = [];
    postedConfig = undefined;

    TestBed.configureTestingModule({
      imports: [AdminFilterConfigComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
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

    // jest.spyOn() reuses an already installed spy, so without this the call
    // history of window.confirm would leak from one test into the next.
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('removes the entry at the given position after confirmation', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await component.onGlobalFilterDelete(1);

      expect(JSON.parse(postedConfig!)).toEqual([{ name: 'first' }, { name: 'third' }]);
    });

    it('keeps the configuration when the confirmation is declined', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      await component.onGlobalFilterDelete(1);

      expect(postedConfig).toBeUndefined();
    });

    it('ignores an index that no longer exists', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      await component.onGlobalFilterDelete(7);

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(postedConfig).toBeUndefined();
    });

    it('clears the grid once the last filter is gone', async () => {
      storedConfig = [{ name: 'only one' }];
      jest.spyOn(window, 'confirm').mockReturnValue(true);
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
