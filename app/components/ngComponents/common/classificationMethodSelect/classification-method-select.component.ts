import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Classification } from 'components/ngComponents/models/classification.models';

@Component({
  selector: 'app-classification-method-select',
  templateUrl: './classification-method-select.component.html',
  styleUrls: ['./classification-method-select.component.scss'],
  standalone: true,
  imports: [FormsModule, OverlayModule],
})
export class ClassificationMethodSelectComponent implements OnInit, OnChanges {
  @Input() defaultMethodId: string = 'quantile';
  @Input() hiddenMethodIds: any[] = [];
  @Output() onMethodSelect = new EventEmitter<any>();

  selectedMethod: Classification | undefined;
  showMethodSelection: boolean = false;
  preloadImgs: any[] = [];

  /** Prefer opening below the trigger, fall back to above when there's no room. */
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  preppedMethods: Classification[] = [];
  methods: Classification[] = [
    {
      name: 'Gleiches Intervall',
      id: 'equal_interval',
      imgPath: 'icons/classificationMethods/neu/gleichesIntervall.svg',
      description:
        'Mit der Methode Gleiches Intervall wird der Bereich der Attributwerte in gleich große Teilbereiche unterteilt.',
    },
    {
      name: 'Jenks',
      id: 'jenks',
      imgPath: 'icons/classificationMethods/neu/jenks.svg',
      description:
        'Bei Jenks (Natürliche Unterbrechungen) werden Klassengrenzen identifiziert, die ähnliche Werte möglichst gut gruppieren und zugleich die Unterschiede zwischen den Klassen maximieren.',
    },
    {
      name: 'Quantile',
      id: 'quantile',
      imgPath: 'icons/classificationMethods/neu/quantile_grau.svg',
      description: 'Bei der Quantil-Methode enthält jede Klasse die gleiche Anzahl von Features.',
    },
    {
      name: 'Regionaler Standard',
      id: 'regional_default',
      imgPath: 'icons/classificationMethods/neu/manuell.svg',
      description:
        'Bei der regionalen Standard-Klassifizierung sind die Klassengrenzen vorgegeben (kann in Administrationsebene angepasst werden).',
    },
    {
      name: 'Manuell',
      id: 'manual',
      imgPath: 'icons/classificationMethods/neu/manuell.svg',
      description:
        'Bei der manuellen Klassifizierung lassen sich die Klassengrenzen nach Bedarf einstellen.',
    },
  ];

  ngOnInit(): void {
    this.prepVals();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.prepVals();
  }

  prepVals() {
    this.selectedMethod = this.methods.filter((e) => e.id == this.defaultMethodId)[0];
    this.preppedMethods = this.methods.filter((e) => !this.hiddenMethodIds.includes(e.id));

    this.preppedMethods.forEach(async (element) => {
      await this.preloadImage(element.imgPath);
      this.preloadImgs[element.name] = element.imgPath;
    });
  }

  preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
    });
  }

  methodSelected(method) {
    this.showMethodSelection = false;
    this.selectedMethod = method;
    this.onMethodSelect.emit(method);
  }
}
