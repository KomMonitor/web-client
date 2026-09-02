import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { IconTranslateService } from './icon-translate.service';

describe('IconTranslateService', () => {
  let service: IconTranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IconTranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('maps glyphicon names to Font Awesome 6 names', () => {
    expect(service.translate('map-marker')).toBe('location-dot');
    expect(service.translate('refresh')).toBe('arrows-rotate');
    expect(service.translate('info-sign')).toBe('circle-info');
    expect(service.translate('home')).toBe('house');
  });

  it('accepts the CSS class form as well as the bare name', () => {
    expect(service.translate('glyphicon-map-marker')).toBe('location-dot');
  });

  it('is case insensitive', () => {
    expect(service.translate('Map-Marker')).toBe('location-dot');
  });

  it('falls back for names it does not know', () => {
    expect(service.translate('not-a-glyphicon')).toBe('circle-question');
  });

  it('falls back for a missing symbol name', () => {
    // `poiSymbolBootstrap3Name` is optional in the API contract.
    expect(service.translate(undefined)).toBe('circle-question');
    expect(service.translate(null)).toBe('circle-question');
    expect(service.translate('')).toBe('circle-question');
  });

  it('never returns an empty icon for a known glyphicon', () => {
    // Guards the table against a blank value slipping in: a blank would render
    // as an invisible icon rather than as the fallback question mark.
    const names = [
      'asterisk',
      'plus',
      'euro',
      'minus',
      'cloud',
      'envelope',
      'pencil',
      'glass',
      'music',
      'search',
      'heart',
      'star',
      'user',
      'film',
      'th-large',
      'th',
      'th-list',
      'ok',
      'remove',
      'zoom-in',
      'zoom-out',
      'off',
      'signal',
      'cog',
      'trash',
      'home',
      'file',
      'time',
      'road',
      'download-alt',
      'download',
      'upload',
      'inbox',
      'play-circle',
      'repeat',
      'refresh',
      'list-alt',
      'lock',
      'flag',
      'headphones',
      'volume-off',
      'volume-down',
      'volume-up',
      'qrcode',
      'barcode',
      'tag',
      'tags',
      'book',
      'bookmark',
      'print',
      'camera',
      'font',
      'bold',
      'italic',
      'text-height',
      'text-width',
      'align-left',
      'align-center',
      'align-right',
      'align-justify',
      'list',
      'indent-left',
      'indent-right',
      'facetime-video',
      'picture',
      'map-marker',
      'adjust',
      'tint',
      'edit',
      'share',
      'check',
      'move',
      'step-backward',
      'fast-backward',
      'backward',
      'play',
      'pause',
      'stop',
      'forward',
      'fast-forward',
      'step-forward',
      'eject',
      'chevron-left',
      'chevron-right',
      'plus-sign',
      'minus-sign',
      'remove-sign',
      'ok-sign',
      'question-sign',
      'info-sign',
      'screenshot',
      'remove-circle',
      'ok-circle',
      'ban-circle',
      'arrow-left',
      'arrow-right',
      'arrow-up',
      'arrow-down',
      'share-alt',
      'resize-full',
      'resize-small',
      'exclamation-sign',
      'gift',
      'leaf',
      'fire',
      'eye-open',
      'eye-close',
      'warning-sign',
      'plane',
      'calendar',
      'random',
      'comment',
      'magnet',
      'chevron-up',
      'chevron-down',
      'retweet',
      'shopping-cart',
      'folder-close',
      'folder-open',
      'resize-vertical',
      'resize-horizontal',
      'hdd',
      'bullhorn',
      'bell',
      'certificate',
      'thumbs-up',
      'thumbs-down',
      'hand-right',
      'hand-left',
      'hand-up',
      'hand-down',
      'circle-arrow-right',
      'circle-arrow-left',
      'circle-arrow-up',
      'circle-arrow-down',
      'globe',
      'wrench',
      'tasks',
      'filter',
      'briefcase',
      'fullscreen',
      'dashboard',
      'paperclip',
      'heart-empty',
      'link',
      'phone',
      'pushpin',
      'usd',
      'gbp',
      'sort',
      'sort-by-alphabet',
      'sort-by-alphabet-alt',
      'sort-by-order',
      'sort-by-order-alt',
      'sort-by-attributes',
      'sort-by-attributes-alt',
      'unchecked',
      'expand',
      'collapse-down',
      'collapse-up',
      'log-in',
      'flash',
      'log-out',
      'new-window',
      'record',
      'save',
      'open',
      'saved',
      'import',
      'export',
      'send',
      'floppy-disk',
      'floppy-saved',
      'floppy-remove',
      'floppy-save',
      'floppy-open',
      'credit-card',
      'transfer',
      'cutlery',
      'header',
      'compressed',
      'earphone',
      'phone-alt',
      'tower',
      'stats',
      'sd-video',
      'hd-video',
      'subtitles',
      'sound-stereo',
      'sound-dolby',
      'sound-5-1',
      'sound-6-1',
      'sound-7-1',
      'copyright-mark',
      'registration-mark',
      'cloud-download',
      'cloud-upload',
      'tree-conifer',
      'tree-deciduous',
      'education',
      'thumbtack',
      'blackboard',
      'bed',
      'tent',
      'ice',
      'ice-lolly',
    ];

    expect(names).toHaveLength(206);

    // The fallback is itself `circle-question`, and `question-sign` is the one
    // glyphicon whose correct answer is exactly that — so it is the only name
    // allowed to look like a fallback here.
    const looksLikeFallback = names.filter((n) => service.translate(n) === 'circle-question');
    expect(looksLikeFallback).toEqual(['question-sign']);

    const blank = names.filter((n) => !service.translate(n)?.trim());
    expect(blank).toEqual([]);
  });
});
