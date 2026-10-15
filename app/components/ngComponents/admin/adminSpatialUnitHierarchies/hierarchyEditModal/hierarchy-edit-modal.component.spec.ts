import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { HierarchyEditModalComponent } from './hierarchy-edit-modal.component';

describe('HierarchyEditModalComponent', () => {
  let fixture: ComponentFixture<HierarchyEditModalComponent>;
  let component: HierarchyEditModalComponent;
  let activeModal: NgbActiveModal;

  const CHAIN = ['Stadt Essen', 'Stadtbezirke Essen', 'Stadtteile Essen'];

  /** Applies the inputs ng-bootstrap would set, then runs the first change detection. */
  function render(inputs: Partial<HierarchyEditModalComponent> = {}): void {
    Object.assign(component, {
      existingNames: ['Verwaltungsgliederung', 'Schulplanung'],
      currentName: 'Verwaltungsgliederung',
      currentDescription: 'Amtliche Gliederung der Stadt',
      currentIsPublic: true,
      mandant: 'Stadt Essen',
      chain: CHAIN,
      hierarchyId: 'a1f5c803-72d9-4b6e-8f14-3ce90ab27d56',
      ...inputs,
    });
    fixture.detectChanges();
  }

  /** The green confirm button of the footer. */
  function submitButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('.modal-footer .btn-success')).nativeElement;
  }

  /** The rendered error message under the name, or null while none shows. */
  function nameError(): HTMLElement | null {
    return (
      fixture.debugElement.query(By.css('app-form-error[for="hierarchy-name-input"] .help-block'))
        ?.nativeElement ?? null
    );
  }

  /** The text of the read-only panel, whitespace squashed. */
  function factsText(): string {
    return fixture.debugElement
      .query(By.css('.facts'))
      .nativeElement.textContent.replace(/\s+/g, ' ')
      .trim();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HierarchyEditModalComponent, TranslateModule.forRoot()],
      providers: [NgbActiveModal],
    });
    fixture = TestBed.createComponent(HierarchyEditModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
  });

  it('prefills the metadata and accepts it unchanged', () => {
    render();

    expect(component.form.controls.name.value).toBe('Verwaltungsgliederung');
    expect(component.form.controls.description.value).toBe('Amtliche Gliederung der Stadt');
    expect(component.form.controls.isPublic.value).toBe(true);
    expect(submitButton().disabled).toBe(false);
  });

  it('shows tenant, chain and id as facts, without a field to edit them', () => {
    render();

    expect(factsText()).toContain('Stadt Essen → Stadtbezirke Essen → Stadtteile Essen');
    expect(factsText()).toContain('a1f5c803-72d9-4b6e-8f14-3ce90ab27d56');
    // The whole dialog carries three fields: the name, the description and the
    // public checkbox.
    expect(fixture.debugElement.queryAll(By.css('input, textarea'))).toHaveLength(3);
  });

  it('says so where a hierarchy has no levels yet', () => {
    render({ chain: [] });

    expect(factsText()).toContain('CHAIN_EMPTY');
  });

  it('falls back to a placeholder where no tenant is known', () => {
    render({ mandant: '' });

    expect(factsText()).toContain('MANDANT_NONE');
  });

  it('rejects an empty name and the name of another hierarchy', () => {
    render();

    component.form.controls.name.setValue('');
    fixture.detectChanges();
    // The button stays active; the error shows on the click instead.
    expect(submitButton().disabled).toBe(false);
    expect(component.form.controls.name.hasError('required')).toBe(true);

    component.form.controls.name.setValue('Schulplanung');
    expect(component.form.controls.name.hasError('uniqueName')).toBe(true);

    // Its own name is the one the check ignores.
    component.form.controls.name.setValue('Verwaltungsgliederung');
    expect(component.form.controls.name.valid).toBe(true);
  });

  it('closes with the trimmed name and description and the public flag', () => {
    const close = jest.spyOn(activeModal, 'close');
    render();
    component.form.controls.name.setValue('  Verwaltung  ');
    component.form.controls.description.setValue('  Gliederung nach Satzung  ');
    component.form.controls.isPublic.setValue(false);

    component.submit();

    expect(close).toHaveBeenCalledWith({
      name: 'Verwaltung',
      description: 'Gliederung nach Satzung',
      isPublic: false,
    });
  });

  it('closes with an empty description where the field was cleared', () => {
    const close = jest.spyOn(activeModal, 'close');
    render();
    // Whitespace alone counts as cleared: the store then leaves the field out
    // of the write, which deletes the description.
    component.form.controls.description.setValue('   ');

    component.submit();

    expect(close.mock.calls[0][0]).toMatchObject({ description: '' });
  });

  it('starts with an empty description where the hierarchy has none', () => {
    render({ currentDescription: '' });

    expect(component.form.controls.description.value).toBe('');
  });

  it('does not close while the name is missing, but shows why', () => {
    const close = jest.spyOn(activeModal, 'close');
    render();
    component.form.controls.name.setValue('');
    fixture.detectChanges();
    expect(nameError()).toBeNull();

    submitButton().click();
    fixture.detectChanges();

    expect(close).not.toHaveBeenCalled();
    expect(nameError()).not.toBeNull();
    expect(document.activeElement?.id).toBe('hierarchy-name-input');
  });

  it('submits on the click once the name is valid', () => {
    const close = jest.spyOn(activeModal, 'close');
    render();

    submitButton().click();

    expect(close).toHaveBeenCalledWith({
      name: 'Verwaltungsgliederung',
      description: 'Amtliche Gliederung der Stadt',
      isPublic: true,
    });
  });

  it('dismisses on cancel', () => {
    const dismiss = jest.spyOn(activeModal, 'dismiss');
    render();

    component.cancel();

    expect(dismiss).toHaveBeenCalledWith('cancel');
  });
});
