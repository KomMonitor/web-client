import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

// CodeMirror measures text via Range#getBoundingClientRect, which jsdom does not
// implement — instantiating it here hard-crashes the Jest worker. The panes are
// browser mechanics; these tests cover the descriptor wiring and the validation.
jest.mock('codemirror', () => {
  const makeEditor = () => ({
    getValue: jest.fn(() => ''),
    setValue: jest.fn(),
    setSize: jest.fn(),
    on: jest.fn(),
  });
  const codeMirror: any = jest.fn(() => makeEditor());
  codeMirror.fromTextArea = jest.fn(() => makeEditor());
  codeMirror.lint = { javascript: jest.fn(() => []), json: jest.fn(() => []) };

  // The component also pulls in codemirror/mode/*. Those files are CommonJS and
  // call defineMode/defineMIME on the *module* object, so the stub has to answer
  // both as the ES default export and at the top level — and hand back a no-op
  // for anything else they reach for.
  const spare = new Map<string, jest.Mock>();
  const proxy: any = new Proxy(codeMirror, {
    get(target, property: string) {
      if (property === 'default') return proxy;
      if (property === '__esModule') return true;
      if (property in target) return (target as any)[property];
      if (!spare.has(property)) spare.set(property, jest.fn());
      return spare.get(property);
    },
  });
  return proxy;
});

import CodeMirror from 'codemirror';

import { ConfigEditorComponent } from './config-editor.component';
import { ConfigEditorDescriptor, LintingIssue } from './config-editor.model';

function buildDescriptor(overrides: Partial<ConfigEditorDescriptor> = {}): ConfigEditorDescriptor {
  return {
    i18nPrefix: 'ADMIN_CONFIG.APP',
    mode: 'javascript',
    formatLabel: 'JavaScript',
    requiredKeywords: ['window.__env', 'window.__env.apiUrl'],
    lint: () => [],
    loadTemplate: () => Promise.resolve('// template'),
    loadCurrent: () => Promise.resolve('window.__env; window.__env.apiUrl;'),
    save: (value) => Promise.resolve(value),
    ...overrides,
  };
}

describe('ConfigEditorComponent', () => {
  let component: ConfigEditorComponent;
  let fixture: ComponentFixture<ConfigEditorComponent>;

  beforeEach(() => {
    // The CodeMirror stub is module-level; drop the calls recorded by earlier tests
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [ConfigEditorComponent, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(ConfigEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('descriptor', buildDescriptor());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CodeMirror host elements', () => {
    // The panes used to be looked up with document.getElementById, and the two
    // former twins used identical ids for three of them. They are view queries
    // now — and because the content sits in an <ng-template> that
    // admin-content-view renders through an outlet, they resolve only after the
    // first change detection, never with { static: true }.
    it('does not resolve the refs before the first change detection', () => {
      expect(component.configEditor).toBeUndefined();
      expect(component.templateCodeMirrorElement).toBeUndefined();
      expect(component.currentCodeMirrorElement).toBeUndefined();
      expect(component.newCodeMirrorElement).toBeUndefined();
    });

    it('resolves all four refs after rendering', () => {
      fixture.detectChanges();

      expect(component.configEditor?.nativeElement?.tagName).toBe('TEXTAREA');
      expect(component.templateCodeMirrorElement?.nativeElement).toBeTruthy();
      expect(component.currentCodeMirrorElement?.nativeElement).toBeTruthy();
      expect(component.newCodeMirrorElement?.nativeElement).toBeTruthy();
    });
  });

  describe('isConfigSettingInvalid', () => {
    it('accepts a config containing every required keyword', () => {
      expect(component.isConfigSettingInvalid('window.__env, window.__env.apiUrl')).toBe(false);
      expect(component.missingRequiredParameters()).toEqual([]);
    });

    it('reports the missing keywords', () => {
      expect(component.isConfigSettingInvalid('window.__env only')).toBe(true);
      expect(component.missingRequiredParameters()).toEqual(['window.__env.apiUrl']);
      expect(component.missingRequiredParameters_string()).toBe('["window.__env.apiUrl"]');
    });

    it('is invalid while the linter reports an error, even with all keywords present', () => {
      const error: LintingIssue = {
        severity: 'error',
        message: 'boom',
        from: { line: 0, ch: 0 },
        to: { line: 0, ch: 1 },
      };
      fixture.componentRef.setInput('descriptor', buildDescriptor({ lint: () => [error] }));
      component.validateCode({}, () => undefined, {});

      expect(component.isConfigSettingInvalid('window.__env, window.__env.apiUrl')).toBe(true);
    });

    it('ignores linter warnings', () => {
      const warning: LintingIssue = {
        severity: 'warning',
        message: 'meh',
        from: { line: 0, ch: 0 },
        to: { line: 0, ch: 1 },
      };
      fixture.componentRef.setInput('descriptor', buildDescriptor({ lint: () => [warning] }));
      component.validateCode({}, () => undefined, {});

      expect(component.isConfigSettingInvalid('window.__env, window.__env.apiUrl')).toBe(false);
    });
  });

  describe('descriptor wiring', () => {
    it('opens all four panes in the descriptor mode after the view is ready', async () => {
      fixture.componentRef.setInput('descriptor', buildDescriptor({ mode: 'application/json' }));
      fixture.detectChanges();
      // detectChanges starts ngAfterViewInit without awaiting it; the hook awaits
      // the data promise, so settling that plus one microtask turn means the
      // editors have been built exactly once.
      await (component as any).dataReady;
      await Promise.resolve();

      // the editable pane comes from a textarea, the three previews from divs
      expect((CodeMirror as any).fromTextArea).toHaveBeenCalledTimes(1);
      expect(CodeMirror as unknown as jest.Mock).toHaveBeenCalledTimes(3);
      const paneOptions = (CodeMirror as unknown as jest.Mock).mock.calls[0][1];
      expect(paneOptions.mode).toBe('application/json');
      expect(paneOptions.readOnly).toBe(true);
    });

    // Regression: window.__env.appConfig was never populated after the AngularJS
    // app.js went away, so loadCurrent() handed back undefined. CodeMirror's
    // setValue() throws on a non-string, which aborted initCodeEditor() before
    // the three preview panes were built — every pane on the page stayed empty.
    it('still opens every pane when the descriptor yields no value', async () => {
      fixture.componentRef.setInput(
        'descriptor',
        buildDescriptor({ loadCurrent: () => Promise.resolve(undefined as unknown as string) })
      );
      fixture.detectChanges();
      await (component as any).dataReady;
      await Promise.resolve();

      expect(component.configCurrent).toBe('');
      const editable = (CodeMirror as any).fromTextArea.mock.results[0].value;
      expect(editable.setValue).toHaveBeenCalledWith('');
      expect(CodeMirror as unknown as jest.Mock).toHaveBeenCalledTimes(3);
    });

    it('loads template and current config through the descriptor', async () => {
      await (component as any).loadConfigData();

      expect(component.configTemplate).toBe('// template');
      expect(component.configCurrent).toBe('window.__env; window.__env.apiUrl;');
      expect(component.configTmp).toBe(component.configCurrent);
      expect(component.loadingData()).toBe(false);
    });

    it('saves through the descriptor and adopts the returned stored state', async () => {
      const save = jest.fn().mockResolvedValue('stored value');
      fixture.componentRef.setInput('descriptor', buildDescriptor({ save }));
      component.configTmp = 'edited value';

      await component.saveConfig();

      expect(save).toHaveBeenCalledWith('edited value');
      expect(component.configCurrent).toBe('stored value');
      expect(component.loadingData()).toBe(false);
    });

    it('keeps the previous state and stops loading when saving fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const save = jest.fn().mockRejectedValue(new Error('nope'));
      fixture.componentRef.setInput('descriptor', buildDescriptor({ save }));
      component.configCurrent = 'untouched';

      await component.saveConfig();

      expect(component.configCurrent).toBe('untouched');
      expect(component.loadingData()).toBe(false);
    });
  });
});
