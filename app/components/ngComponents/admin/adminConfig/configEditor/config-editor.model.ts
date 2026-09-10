/** The subset of the CodeMirror instance API these editors use. */
export interface CodeMirrorEditor {
  getValue(): string;
  setValue(value: string): void;
  setSize(width: number | null, height: number): void;
  on(event: string, callback: (cm: any) => void): void;
}

export interface LintingIssue {
  severity: 'error' | 'warning';
  message: string;
  from: { line: number; ch: number };
  to: { line: number; ch: number };
}

/**
 * Everything that differs between the config editors (app config, controls
 * config, filter config). `<app-config-editor-panes>` renders the four
 * CodeMirror panes and drives them; the hosting page supplies one of these.
 */
export interface ConfigEditorDescriptor {
  /**
   * i18n namespace of the page-specific texts. The panes need `EDITOR_LABEL`,
   * `SAVE` and `MSG.SAVED` / `MSG.SAVE_FAILED` / `MSG.LOAD_FAILED`; everything
   * else comes from `ADMIN_CONFIG.COMMON.*`. The page frame around the panes is
   * the hosting component's own template and uses the same namespace.
   */
  i18nPrefix: string;

  /** CodeMirror mode for all four panes. */
  mode: 'javascript' | 'application/json';

  /** Format name for the `ADMIN_CONFIG.COMMON.INVALID_HINT` parameter. */
  formatLabel: string;

  /** Keywords a valid configuration has to contain, checked verbatim. */
  requiredKeywords: string[];

  /** Runs the CodeMirror linter matching `mode`. */
  lint(cm: any, options: any): LintingIssue[];

  /** The read-only reference template shown next to the current config. */
  loadTemplate(): Promise<string>;

  /** The configuration currently in effect. */
  loadCurrent(): Promise<string>;

  /** Persists `value` and returns the stored state for the "current" pane. */
  save(value: string): Promise<string>;
}
