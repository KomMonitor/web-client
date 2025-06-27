import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-classification-method-select',
  templateUrl: './classification-method-select.component.html',
  styleUrls: ['./classification-method-select.component.css']
})
export class ClassificationMethodSelectComponent implements OnInit, OnChanges {

  @Input() defaultMethodId: string = 'quantile';
  @Input() hiddenMethodIds:any[] = [];
  @Output() onMethodSelect = new EventEmitter<any>();

  selectedMethod;
  showMethodSelection = false;

  preppedMethods:any[] = [];
  methods = [
    {
      name: 'Regionaler Standard', 
      id: 'regional_default', 
      imgPath: 'icons/classificationMethods/neu/manuell.svg',
      description: 'Bei der regionalen Standard-Klassifizierung sind die Klassengrenzen vorgegeben (kann in Administrationsebene angepasst werden).'},
    {
      name: 'Jenks', 
      id: 'jenks',
      imgPath: 'icons/classificationMethods/neu/jenks.svg',
      description: 'Bei Jenks (Natürliche Unterbrechungen) werden Klassengrenzen identifiziert, die ähnliche Werte möglichst gut gruppieren und zugleich die Unterschiede zwischen den Klassen maximieren.'
    },
    {
      name: 'Gleiches Intervall', 
      id: 'equal_interval', 
      imgPath: 'icons/classificationMethods/neu/gleichesIntervall.svg',
      description: 'Mit der Methode Gleiches Intervall wird der Bereich der Attributwerte in gleich große Teilbereiche unterteilt.'},
    {
      name: 'Quantile', 
      id: 'quantile', 
      imgPath: 'icons/classificationMethods/neu/quantile_grau.svg',
      description: 'Bei der Quantil-Methode enthält jede Klasse die gleiche Anzahl von Features.'},
    {
      name: 'Manuell', 
      id: 'manual', 
      imgPath: 'icons/classificationMethods/neu/manuell.svg',
      description: 'Bei der manuellen Klassifizierung lassen sich die Klassengrenzen nach Bedarf einstellen.'}
  ];

  ngOnInit(): void {
    this.prepVals();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.prepVals();
  }

  prepVals() {
    this.selectedMethod = this.methods.filter(e => e.id==this.defaultMethodId)[0];
    this.preppedMethods = this.methods.filter(e => !this.hiddenMethodIds.includes(e.id));
  }

  methodSelected(method) {
    this.showMethodSelection = false;
    this.selectedMethod = method;
    this.onMethodSelect.emit(method);
  }
}
