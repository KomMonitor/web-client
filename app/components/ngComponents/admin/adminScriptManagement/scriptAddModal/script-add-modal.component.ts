import { Component, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';

@Component({
  selector: 'app-script-add-modal',
  templateUrl: './script-add-modal.component.html',
  styleUrls: ['./script-add-modal.component.css']
})
export class ScriptAddModalComponent {
  loadingData: boolean = false;

  // multistep
  currentStep: number = 0;

  datasetName: string = '';
  description: string = '';

  indicatorNameFilter: string = '';
  georesourceNameFilter: string = '';

  selectedTargetIndicator: any = null;
  tmpIndicatorSelection: any = null;
  tmpGeoresourceSelection: any = null;

  requiredIndicators: any[] = [];
  requiredGeoresources: any[] = [];

  parameterNameTmp: string = '';
  parameterDescriptionTmp: string = '';
  parameterDataTypeTmp: any = null;
  parameterDefaultValueTmp: any = '';
  parameterNumericMinValueTmp: number | null = null;
  parameterNumericMaxValueTmp: number | null = null;

  scriptCodePreview: string | undefined = undefined;

  errorMessagePart: string | undefined = undefined;
  errorMessagePartIndicatorMetadata: string | undefined = undefined;

  constructor(
    public activeModal: NgbActiveModal,
    public indicatorExchange: KommonitorIndicatorDataExchangeService,
    @Inject('kommonitorScriptHelperService') public scriptHelper: any
  ) {
    try { this.scriptHelper.reset?.(); } catch {}
  }

  get availableIndicators(): any[] {
    try { return this.indicatorExchange.availableIndicators || []; } catch { return []; }
  }

  get availableGeoresources(): any[] {
    try { return this.indicatorExchange.availableGeoresources || []; } catch { return []; }
  }

  get availableScriptDataTypes(): any[] {
    try { return this.scriptHelper.availableScriptDataTypes || []; } catch { return []; }
  }

  get availableScriptTypeOptions(): any[] {
    try { return this.scriptHelper.availableScriptTypeOptions || []; } catch { return []; }
  }

  get filteredIndicators(): any[] {
    const all = this.availableIndicators || [];
    const f = (this.indicatorNameFilter || '').toLowerCase();
    if (!f) { return all; }
    return all.filter((ind: any) => {
      const name = (ind?.indicatorName || '').toLowerCase();
      const unit = (ind?.unit || '').toLowerCase();
      return name.includes(f) || unit.includes(f);
    });
  }

  get filteredGeoresources(): any[] {
    const all = this.availableGeoresources || [];
    const f = (this.georesourceNameFilter || '').toLowerCase();
    if (!f) { return all; }
    return all.filter((g: any) => {
      const name = (g?.datasetName || '').toLowerCase();
      return name.includes(f);
    });
  }

  onChangeTargetIndicator(indicator: any): void {
    this.selectedTargetIndicator = indicator || null;
    try { this.scriptHelper.targetIndicator = this.selectedTargetIndicator; } catch {}
  }

  addBaseIndicator(): void {
    if (!this.tmpIndicatorSelection) { return; }
    try { this.scriptHelper.addBaseIndicator?.(this.tmpIndicatorSelection); } catch {}
    this.requiredIndicators = [...(this.requiredIndicators || []), this.tmpIndicatorSelection];
    this.tmpIndicatorSelection = null;
  }

  removeBaseIndicator(ind: any): void {
    try { this.scriptHelper.removeBaseIndicator?.(ind); } catch {}
    this.requiredIndicators = (this.requiredIndicators || []).filter((x: any) => x?.indicatorId !== ind?.indicatorId);
  }

  addBaseGeoresource(): void {
    if (!this.tmpGeoresourceSelection) { return; }
    try { this.scriptHelper.addBaseGeoresource?.(this.tmpGeoresourceSelection); } catch {}
    this.requiredGeoresources = [...(this.requiredGeoresources || []), this.tmpGeoresourceSelection];
    this.tmpGeoresourceSelection = null;
  }

  removeBaseGeoresource(geo: any): void {
    try { this.scriptHelper.removeBaseGeoresource?.(geo); } catch {}
    this.requiredGeoresources = (this.requiredGeoresources || []).filter((x: any) => x?.georesourceId !== geo?.georesourceId);
  }

  onParamTypeChange(): void {
    // reset numeric constraints when type changes
    if (!this.parameterDataTypeTmp || (this.parameterDataTypeTmp.apiName !== 'integer' && this.parameterDataTypeTmp.apiName !== 'double')) {
      this.parameterNumericMinValueTmp = null;
      this.parameterNumericMaxValueTmp = null;
    }
  }

  addScriptParameter(): void {
    if (!this.parameterNameTmp || !this.parameterDescriptionTmp || this.parameterDefaultValueTmp === undefined || this.parameterDefaultValueTmp === null || !this.parameterDataTypeTmp) {
      return;
    }
    try {
      this.scriptHelper.addScriptParameter?.(
        this.parameterNameTmp,
        this.parameterDescriptionTmp,
        this.parameterDataTypeTmp,
        this.parameterDefaultValueTmp,
        this.parameterNumericMinValueTmp,
        this.parameterNumericMaxValueTmp
      );
    } catch {}
    this.parameterNameTmp = '';
    this.parameterDescriptionTmp = '';
    this.parameterDefaultValueTmp = '';
    this.parameterDataTypeTmp = null;
    this.parameterNumericMinValueTmp = null;
    this.parameterNumericMaxValueTmp = null;
  }

  removeScriptParameter(p: any): void {
    try { this.scriptHelper.removeScriptParameter?.(p); } catch {}
  }

  onScriptFileSelected(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      this.scriptCodePreview = content;
      try { this.scriptHelper.scriptCode_readableString = content; } catch {}
    };
    reader.onerror = () => {
      this.errorMessagePart = 'Fehler beim Lesen der Skriptdatei.';
    };
    reader.readAsText(file);
  }

  canSubmit(): boolean {
    const hasBasics = !!this.datasetName && !!this.description && !!this.selectedTargetIndicator;
    const hasCode = !!this.scriptHelper?.scriptCode_readableString;
    const hasInputs = (this.requiredIndicators?.length || 0) > 0 || (this.requiredGeoresources?.length || 0) > 0;
    return hasBasics && hasCode && hasInputs && !this.loadingData;
  }

  async onRegisterScript(): Promise<void> {
    if (!this.canSubmit()) { return; }
    this.loadingData = true;
    this.errorMessagePart = undefined;
    this.errorMessagePartIndicatorMetadata = undefined;
    try {
      const resp = await this.scriptHelper.postNewScript?.(this.datasetName, this.description, this.selectedTargetIndicator);
      // optionally update indicator method if requested in helper
      try {
        if (this.scriptHelper.scriptFormulaHTML_overwriteTargetIndicatorMethod) {
          await this.scriptHelper.replaceMethodMetadataForTargetIndicator?.(this.selectedTargetIndicator);
        }
      } catch (metaErr: any) {
        try { this.errorMessagePartIndicatorMetadata = this.indicatorExchange.syntaxHighlightJSON(metaErr?.data || metaErr); } catch {}
      }
      this.loadingData = false;
      this.activeModal.close('success');
    } catch (err: any) {
      try { this.errorMessagePart = this.indicatorExchange.syntaxHighlightJSON(err?.data || err); } catch {}
      this.loadingData = false;
    }
  }

  // step controls
  goToStep(step: any): void {
    const idx = typeof step === 'number' ? step : parseInt(step, 10);
    if (isNaN(idx)) { return; }
    if (idx < 0) { this.currentStep = 0; return; }
    if (idx > 2) { this.currentStep = 2; return; }
    this.currentStep = idx;
  }

  nextStep(): void { this.goToStep(this.currentStep + 1); }
  prevStep(): void { this.goToStep(this.currentStep - 1); }
}


