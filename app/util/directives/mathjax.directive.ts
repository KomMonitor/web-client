import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';
import { MathjaxService } from 'services/mathjax-service/mathjax.service';

/**
 * Renders HTML that contains LaTeX and typesets it.
 *
 * Replaces master's `styleMathFormula` / `typesetContainerByClass` pair, which
 * wrote into the DOM by element id and re-registered handlers on every viewport
 * change. Here the host element owns its content and re-typesets whenever the
 * text changes.
 */
@Directive({
  selector: '[appMathjax]',
  standalone: true,
})
export class MathjaxDirective implements OnChanges {
  private elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private mathjaxService = inject(MathjaxService);

  /** The HTML to show; LaTeX between `$$…$$` is typeset after rendering. */
  @Input('appMathjax') content = '';

  ngOnChanges(): void {
    const element = this.elementRef.nativeElement;
    element.innerHTML = this.content ?? '';
    void this.mathjaxService.typeset(element);
  }
}
