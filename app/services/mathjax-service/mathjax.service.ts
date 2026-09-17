import { Injectable } from '@angular/core';

/** Minimal surface of the global MathJax object this app uses. */
interface MathJaxGlobal {
  typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
  startup?: { promise: Promise<void> };
  tex?: unknown;
  options?: unknown;
  skipStartupTypeset?: boolean;
}

declare global {
  interface Window {
    MathJax?: MathJaxGlobal;
  }
}

/** Where the bundle is served from; copied out of node_modules by angular.json. */
const MATHJAX_SRC = 'mathjax/tex-mml-chtml.js';

/**
 * Loads MathJax on first use and typesets elements with it.
 *
 * Deliberately not part of the bundle: the library is several megabytes and is
 * only needed where formulas appear — today the schedule dialog's methodology
 * preview. The script tag is added once and shared by every caller.
 */
@Injectable({
  providedIn: 'root',
})
export class MathjaxService {
  private loadPromise: Promise<void> | undefined;

  /**
   * Typesets a container. Resolves without doing anything when MathJax cannot
   * be loaded — a formula shown as its LaTeX source is a degraded display, not
   * a reason to fail the surrounding view.
   */
  async typeset(element: HTMLElement | undefined | null): Promise<void> {
    if (!element) {
      return;
    }
    try {
      await this.load();
      await window.MathJax?.typesetPromise?.([element]);
    } catch (error) {
      console.error('Could not typeset formulas with MathJax:', error);
    }
  }

  private load(): Promise<void> {
    this.loadPromise ??= new Promise<void>((resolve, reject) => {
      if (window.MathJax?.typesetPromise) {
        resolve();
        return;
      }
      // Has to be in place before the bundle runs. The single-dollar inline
      // delimiter is what the legends use ("$A$: …"); MathJax does not enable
      // it by default, so without this the formulas stay visible as source.
      window.MathJax = {
        tex: {
          inlineMath: [
            ['$', '$'],
            ['\\(', '\\)'],
          ],
        },
        skipStartupTypeset: true,
        options: { skipHtmlTags: ['script', 'style'], safeOptions: { allow: false } },
      } as MathJaxGlobal;

      const script = document.createElement('script');
      script.src = MATHJAX_SRC;
      script.async = true;
      script.onload = () => {
        void (window.MathJax?.startup?.promise ?? Promise.resolve()).then(() => resolve());
      };
      script.onerror = () => reject(new Error('could not load ' + MATHJAX_SRC));
      document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}
