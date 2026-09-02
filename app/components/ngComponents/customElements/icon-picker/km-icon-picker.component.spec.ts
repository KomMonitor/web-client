import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { GlyphiconIcon } from 'services/icon-translate/icon-translate.service';
import { KmIconPickerComponent } from './km-icon-picker.component';

@Component({
  standalone: true,
  imports: [KmIconPickerComponent, ReactiveFormsModule],
  template: `<km-icon-picker [formControl]="control" />`,
})
class ReactiveHostComponent {
  control = new FormControl<string>('home', { nonNullable: true });
}

/** The binding the two georesource dialogs actually use. */
@Component({
  standalone: true,
  imports: [KmIconPickerComponent, ReactiveFormsModule],
  template: `<form [formGroup]="form"><km-icon-picker formControlName="poiIconName" /></form>`,
})
class FormGroupHostComponent {
  form = new FormGroup({
    poiIconName: new FormControl('map-marker', { nonNullable: true }),
  });
}

describe('KmIconPickerComponent', () => {
  describe('with [formControl]', () => {
    let fixture: ComponentFixture<ReactiveHostComponent>;
    let host: ReactiveHostComponent;
    let picker: KmIconPickerComponent;

    const iconFor = (name: string): GlyphiconIcon =>
      picker.allIcons.find((icon) => icon.name === name)!;

    const renderedPanel = (): HTMLElement => {
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.km-icon-panel');
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ReactiveHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(ReactiveHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      picker = fixture.debugElement.children[0].componentInstance;
    });

    it('resolves the control value to a table entry', () => {
      expect(picker.value).toBe('home');
      expect(picker.selectedIcon?.faName).toBe('house');
      expect(picker.isUnknownValue).toBe(false);
    });

    it('writes back the glyphicon name, not the Font Awesome name', () => {
      // The load-bearing contract: `poiSymbolBootstrap3Name` is a glyphicon name.
      picker.selectIcon(iconFor('map-marker'));

      expect(host.control.value).toBe('map-marker');
      expect(host.control.value).not.toBe('location-dot');
    });

    it('takes a value pushed in from the host', () => {
      host.control.setValue('education');
      fixture.detectChanges();

      expect(picker.selectedIcon?.faName).toBe('graduation-cap');
    });

    it('does not emit while taking a value', () => {
      host.control.setValue('education');
      fixture.detectChanges();

      expect(host.control.pristine).toBe(true);
    });

    it('keeps a name the table does not know', () => {
      host.control.setValue('not-a-glyphicon');
      fixture.detectChanges();

      expect(picker.value).toBe('not-a-glyphicon');
      expect(picker.selectedIcon).toBeUndefined();
      expect(picker.isUnknownValue).toBe(true);

      // Opening and closing the panel must not rewrite it.
      picker.toggle();
      picker.close();

      expect(host.control.value).toBe('not-a-glyphicon');
    });

    it('highlights through prefix and casing without touching the stored value', () => {
      host.control.setValue('Glyphicon-Home');
      fixture.detectChanges();

      expect(picker.selectedIcon?.name).toBe('home');
      expect(host.control.value).toBe('Glyphicon-Home');
    });

    it('marks the control touched when the panel closes again', () => {
      picker.toggle();
      picker.close();

      expect(host.control.touched).toBe(true);
    });

    it('does not mark it touched without an interaction', () => {
      picker.close();

      expect(host.control.touched).toBe(false);
    });

    it('honours a disabled control', () => {
      host.control.disable();
      fixture.detectChanges();

      expect(picker.disabled).toBe(true);

      picker.toggle();
      expect(picker.isOpen).toBe(false);

      picker.selectIcon(iconFor('map-marker'));
      expect(host.control.value).toBe('home');
    });

    it('closes an open panel when the control is disabled', () => {
      picker.toggle();
      expect(picker.isOpen).toBe(true);

      host.control.disable();
      fixture.detectChanges();

      expect(picker.isOpen).toBe(false);
    });

    describe('outside click', () => {
      it('stays open for a click inside the panel', () => {
        picker.toggle();
        const panel = renderedPanel();

        panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(picker.isOpen).toBe(true);
      });

      it('closes for a click elsewhere in the document', () => {
        picker.toggle();

        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(picker.isOpen).toBe(false);
      });
    });

    describe('search', () => {
      const names = () => picker.filteredIcons.map((icon) => icon.name);

      it('matches the glyphicon name', () => {
        picker.onSearchChange('marker');

        expect(names()).toContain('map-marker');
      });

      it('matches the Font Awesome name too', () => {
        // The glyphicon vocabulary is old; "house" is what an admin types.
        picker.onSearchChange('house');

        expect(names()).toContain('home');
      });

      it('normalises prefix, casing and spaces', () => {
        picker.onSearchChange('  Glyphicon-Map Marker ');

        expect(names()).toContain('map-marker');
      });

      it('comes up empty for a term nothing matches', () => {
        picker.onSearchChange('zzz');

        expect(picker.filteredIcons).toEqual([]);
      });

      it('resets when the panel closes', () => {
        picker.toggle();
        picker.onSearchChange('marker');
        picker.close();

        expect(picker.searchTerm).toBe('');
        expect(picker.filteredIcons.length).toBe(picker.allIcons.length);
      });
    });
  });

  describe('with formControlName', () => {
    let fixture: ComponentFixture<FormGroupHostComponent>;
    let host: FormGroupHostComponent;
    let picker: KmIconPickerComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FormGroupHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(FormGroupHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      picker = fixture.debugElement.query(
        (node) => node.name === 'km-icon-picker'
      ).componentInstance;
    });

    it('takes the value from the group', () => {
      expect(picker.selectedIcon?.name).toBe('map-marker');
    });

    it('writes a pick back into the group', () => {
      picker.selectIcon(picker.allIcons.find((icon) => icon.name === 'education')!);

      expect(host.form.controls.poiIconName.value).toBe('education');
    });
  });
});
