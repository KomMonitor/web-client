import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TriState } from './dataset-permissions.model';
import { TriStateCheckboxDirective } from './tri-state-checkbox.directive';

@Component({
  imports: [TriStateCheckboxDirective],
  template: `<input type="checkbox" [appTriState]="state()" />`,
})
class HostComponent {
  readonly state = signal<TriState>('none');
}

describe('TriStateCheckboxDirective', () => {
  it('maps all, some and none onto checked and indeterminate', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const box = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const read = () => [box.checked, box.indeterminate];

    fixture.detectChanges();
    expect(read()).toEqual([false, false]);

    fixture.componentInstance.state.set('some');
    fixture.detectChanges();
    expect(read()).toEqual([false, true]);

    fixture.componentInstance.state.set('all');
    fixture.detectChanges();
    expect(read()).toEqual([true, false]);
  });
});
