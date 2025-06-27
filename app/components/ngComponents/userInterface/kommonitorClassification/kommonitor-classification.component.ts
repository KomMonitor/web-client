import { Component, OnInit } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { colorbrewer } from './colors';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'kommonitor-classification-component',
  templateUrl: './kommonitor-classification.component.html',
  styleUrls: ['./kommonitor-classification.component.css']
})
export class KommonitorClassificationComponent implements OnInit {

  exchangeData: DataExchange;

  methodName = 'Klassifizierungsmethode auswählen';
  showMethodSelection = false;
  addBtnHeight = [0, 0];
  showAddBtn = [false, false];

  isDraggingBreak = false;
  draggingBreak!:any;
  nrOfDraggingBreak = null;
  dynamicDraggingSite = 0;

  containsZeroValues = false;
  containsNegativeValues = false;
  containsOutliers_high = false;
  containsOutliers_low = false;
  containsNoData;

  hiddenMethodIds:any[] = [];

  colorbrewerSchemes!:any;
  colorbrewerPalettes:any[] = [];

  selectedColorBrewerPaletteEntry!:any;

  customColorSchemes = window.__env.customColorSchemes;

  constructor(
    private dataExchangeService: DataExchangeService,
    protected visualStyleHelperService: VisualStyleHelperServiceNew,
    private broadcastService: BroadcastService
  ) {
    this.exchangeData = dataExchangeService.pipedData;

    // Add custom color themes from configuration properties
    if(this.customColorSchemes) {
      var colorbrewer = Object.assign(this.customColorSchemes, colorbrewer);
    }
  }

  ngOnInit(): void {
      

    this.instantiateColorBrewerPalettes();

     // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'onChangeSelectedIndicator' : {
          this.onChangeSelectedIndicator();
        } break;
        case 'updateClassificationComponent': {
          this.updateClassificationComponent(values);
        } break;
        case 'updateShowRegionalDefaultOption': {
          this.updateShowRegionalDefaultOption(values);
        } break;
      }
    });

    if(window.__env.disableManualClassification) {
      this.hideManualClassification();
    }
  }
 
 instantiateColorBrewerPalettes() {


    for (const key in colorbrewer) {
      if (colorbrewer.hasOwnProperty(key)) {
        const colorPalettes = colorbrewer[key];
        
        var paletteEntry = {
          "paletteName": key,
          "paletteArrayObject": colorPalettes
        };

       this.colorbrewerPalettes.push(paletteEntry);
      }
    }

    // instantiate with palette 'Blues'
    this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes[13];

      for (const colorbrewerPalette of this.colorbrewerPalettes) {
        if (colorbrewerPalette.paletteName === this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName){
        this.selectedColorBrewerPaletteEntry = colorbrewerPalette;
          break;
        }
      }

  };

  onChangeSelectedIndicator() {
    for (const colorbrewerPalette of this.colorbrewerPalettes) {
      if (colorbrewerPalette.paletteName === this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName){
       this.selectedColorBrewerPaletteEntry = colorbrewerPalette;
        break;
      }
    }
  }

  onClickColorBrewerEntry(colorPaletteEntry) {
    this.selectedColorBrewerPaletteEntry = colorPaletteEntry;

    this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName = this.selectedColorBrewerPaletteEntry.paletteName;

    this.broadcastService.broadcast("changeColorScheme", [this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName]);

  };


  updateClassificationComponent([containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate]) {
    this.containsZeroValues = containsZeroValues;
    this.containsNegativeValues = containsNegativeValues;
    this.containsOutliers_high = containsOutliers_high;
    this.containsOutliers_low = containsOutliers_low;
    this.containsNoData = containsNoData;
  }

  updateShowRegionalDefaultOption([show]) {
    if(show){
      if(this.hiddenMethodIds.includes('regional_default')) {
       this.hiddenMethodIds.splice(this.hiddenMethodIds.indexOf('regional_default'), 1);
      }
    }
    else {
      if(!this.hiddenMethodIds.includes('regional_default')) {
       this.hiddenMethodIds.push('regional_default');
      }
    }
  }

 hideManualClassification() {
    if(!this.hiddenMethodIds.includes('manual')) {
     this.hiddenMethodIds.push('manual');
    }
  }

  onMethodSelected(method) {
    this.methodName = method.name;
    this.showMethodSelection = false;
    this.visualStyleHelperService.classifyMethod = method.id;
    this.broadcastService.broadcast("changeClassifyMethod", [this.visualStyleHelperService.classifyMethod]);
  }
  
  onChangeSelectedClassifyMethod() {
    this.broadcastService.broadcast("changeClassifyMethod", [this.visualStyleHelperService.classifyMethod]);
  } 
 
  onChangeNumberOfClasses() {
    this.broadcastService.broadcast("changeNumClasses", [this.visualStyleHelperService.numClasses]);
  }

 toggleAddBtn(e, site) {
    if(!this.showAddBtn[site] && e.buttons === 0) {
     this.showAddBtn = [false, false];
     this.showAddBtn[site] = true;
    }

    var rect = e.currentTarget.getBoundingClientRect();
    var y = Math.floor(e.clientY - rect.top);
    if (y > 0 && y < rect.height) {
     this.addBtnHeight[site] = y;
    }
  }

 addNewBreaks(site) {
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues) 
      || this.exchangeData.isMeasureOfValueChecked) {
     this.addNewBreak();
    }
    else {
     this.addNewBreakDynamic(site);
      if(this.exchangeData.isMeasureOfValueChecked) {
        this.addNewBreak();
      }
    }
  }

 addNewBreak() {
    let histogram = document.querySelectorAll<HTMLElement>(".editableHistogram")[0];
    if(this.visualStyleHelperService.manualBrew.breaks.length <  10) {
      if(this.addBtnHeight[0] >= 0 &&this.addBtnHeight[0] < histogram.offsetHeight) {
        let breaks = this.visualStyleHelperService.manualBrew.breaks;
        let newBreak = Math.floor((this.addBtnHeight[0] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
        if(!this.visualStyleHelperService.manualBrew.breaks.includes(newBreak)) {
          this.visualStyleHelperService.manualBrew.breaks.push(newBreak);
          this.visualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
            return a - b;
          });

          this.broadcastService.broadcast("changeBreaks", [this.visualStyleHelperService.manualBrew.breaks]);
        }

        if((this.exchangeData.isBalanceChecked 
          || this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
          ||this.containsNegativeValues)
          && this.exchangeData.isMeasureOfValueChecked) {
         this.updateDynamicBreaksFromManualBreaks();
        }
      }
    }
  }

 addNewBreakDynamic(site) {
    let histograms = Array.from(document.querySelectorAll<HTMLElement>(".editableHistogram"));
    histograms.reverse();
    let histogram = histograms[site];

    if(this.visualStyleHelperService.dynamicBrew[site].breaks.length <  5) {
      if(this.addBtnHeight[site] >= 0 &&this.addBtnHeight[site] < histogram.offsetHeight) {
        let breaks = this.visualStyleHelperService.dynamicBrew[site].breaks;
        let newBreak = Math.floor((this.addBtnHeight[site] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
        if(!this.visualStyleHelperService.dynamicBrew[site].breaks.includes(newBreak)){
          this.visualStyleHelperService.dynamicBrew[site].breaks.push(newBreak);
          this.visualStyleHelperService.dynamicBrew[site].breaks.sort(function(a, b) {
            return a - b;
          });

          let increaseBreaks = this.visualStyleHelperService.dynamicBrew[0] ? this.visualStyleHelperService.dynamicBrew[0].breaks : [];
          let decreaseBreaks = this.visualStyleHelperService.dynamicBrew[1] ? this.visualStyleHelperService.dynamicBrew[1].breaks : [];
        
          this.broadcastService.broadcast("changeDynamicBreaks", [[increaseBreaks, decreaseBreaks]]);
        }
      }
    }
  }

 updateDynamicBreaksFromManualBreaks(){
    let increaseBreaks:any[] = [];
    let decreaseBreaks:any[] = [];
    this.visualStyleHelperService.manualBrew.breaks.forEach((br) => {
      if (br < 0) {
        decreaseBreaks.push(br);
      }
      else {
        increaseBreaks.push(br);
      }
    });
 
    this.broadcastService.broadcast("changeDynamicBreaks", [[increaseBreaks, decreaseBreaks]]);
  }
 
 breakIsUnalterable(br) {
    if(this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      ||this.containsNegativeValues){
      if(this.visualStyleHelperService.dynamicBrewBreaks) {
        if(this.visualStyleHelperService.dynamicBrewBreaks[1]) {
          if(br == this.visualStyleHelperService.dynamicBrewBreaks[1][0]){
            return true;
          }
          if(br == this.visualStyleHelperService.dynamicBrewBreaks[1][this.visualStyleHelperService.dynamicBrewBreaks[1].length-1]){
            return true;
          }
        }
        if(this.visualStyleHelperService.dynamicBrewBreaks[0]) {
          if(br == this.visualStyleHelperService.dynamicBrewBreaks[0][0]){
            return true;
          }
          if(br == this.visualStyleHelperService.dynamicBrewBreaks[0][this.visualStyleHelperService.dynamicBrewBreaks[0].length-1]){
            return true;
          }
        }
      }
    }
    return false;
  }

 deleteBreak(i, site) {
    if((this.exchangeData.isBalanceChecked 
      || this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      || this.containsNegativeValues)) {
      if(this.exchangeData.isMeasureOfValueChecked) {
        this.visualStyleHelperService.manualBrew.breaks.splice(i, 1);
        
        this.broadcastService.broadcast("changeBreaks", [this.visualStyleHelperService.manualBrew.breaks]);
        this.updateDynamicBreaksFromManualBreaks();
      }
      else {
        this.visualStyleHelperService.dynamicBrew[site].breaks.splice(i, 1);
        let increaseBreaks = this.visualStyleHelperService.dynamicBrew[0] ? this.visualStyleHelperService.dynamicBrew[0].breaks : [];
        let decreaseBreaks = this.visualStyleHelperService.dynamicBrew[1] ? this.visualStyleHelperService.dynamicBrew[1].breaks : [];
        
        this.broadcastService.broadcast("changeDynamicBreaks", [[increaseBreaks, decreaseBreaks]])
      }
    }

    else {
      this.visualStyleHelperService.manualBrew.breaks.splice(i, 1);
     
      this.broadcastService.broadcast("changeBreaks", [this.visualStyleHelperService.manualBrew.breaks]);
    }
  }

 onBreaksChanged(e, i, site) {
    e.currentTarget.disabled = true;
    
    let breaks = [...this.visualStyleHelperService.manualBrew.breaks];
    if(e.currentTarget.value <= breaks[0] || e.currentTarget.value >= breaks[breaks.length - 1] || breaks.includes(Number(e.currentTarget.value))) {
      e.currentTarget.value = breaks[i];

      // todo, wrap into timeout if necessary
      //setTimeout(function () {
          e.currentTarget.value = breaks[i];
          this.visualStyleHelperService.manualBrew.breaks[i] = breaks[i];
      //}, 10);
    }
    else {
      this.visualStyleHelperService.manualBrew.breaks[i] = Number(e.currentTarget.value);
      this.visualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
        return a - b;
      });

      
      this.broadcastService.broadcast("changeBreaks", [this.visualStyleHelperService.manualBrew.breaks]);
      
      if((this.exchangeData.isBalanceChecked 
        || this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
        || this.containsNegativeValues)
        && this.exchangeData.isMeasureOfValueChecked) {
       this.updateDynamicBreaksFromManualBreaks();
      }
    }
  }

 onBreaksChangedDynamic(e, i, site) {
    e.currentTarget.disabled = true;
    
    let breaks = [...this.visualStyleHelperService.dynamicBrew[site].breaks];
    if(e.currentTarget.value <= breaks[0] || e.currentTarget.value >= breaks[breaks.length - 1] || breaks.includes(Number(e.currentTarget.value))) {
      e.currentTarget.value = breaks[i];

      // todo, wrap in timeout if necessary
      /* setTimeout(function () {
       $apply(function(){ */
          e.currentTarget.value = breaks[i];
          this.visualStyleHelperService.dynamicBrew[site].breaks[i] = breaks[i];
    /*     });
      }, 10); */
    }
    else {
      this.visualStyleHelperService.dynamicBrew[site].breaks[i] = Number(e.currentTarget.value);
      this.visualStyleHelperService.dynamicBrew[site].breaks.sort(function(a, b) {
        return a - b;
      });
      
      this.broadcastService.broadcast("changeDynamicBreaks", [[this.visualStyleHelperService.dynamicBrew[0].breaks, this.visualStyleHelperService.dynamicBrew[1].breaks]]);
    }
  }

 onBreakDblClick(e, i, site) {
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues)
      || this.exchangeData.isMeasureOfValueChecked) {
      if (i == 0 || i == this.visualStyleHelperService.manualBrew.breaks.length-1 || this.breakIsUnalterable(this.visualStyleHelperService.manualBrew.breaks[i])) {
        return;
      }
    }
    else {
      if (i == 0 || i == this.visualStyleHelperService.dynamicBrew[site].breaks.length-1 || this.breakIsUnalterable(this.visualStyleHelperService.dynamicBrew[site].breaks[i])) {
        return;
      }
    }
    let input = e.currentTarget.children[0].children[0];
    input.disabled = false;
    input.focus();

    if (window.getSelection) {
      window.getSelection()!.removeAllRanges();
    } else if (document.getSelection()) {
        document.getSelection()!.empty();
    }
  }
  
 restyleCurrentLayer() {
    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }
 
 getWidthForHistogramBar(i) {
    let colors = this.visualStyleHelperService.manualBrew.colors ? this.visualStyleHelperService.manualBrew.colors : [];
    let countArray:any[] = [];
    colors.forEach( (color:any) => {
      countArray.push(this.visualStyleHelperService.featuresPerColorMap.get(color) || 0);
    });
    return (countArray[i] / Math.max(...countArray)) * 100 || 0;
  };
 getWidthForHistogramBarMOV(side, i) {
    let colors:any[] = [];
    colors[0] = this.visualStyleHelperService.measureOfValueBrew[0] ? this.visualStyleHelperService.measureOfValueBrew[0].colors : [];
    colors[1] = this.visualStyleHelperService.measureOfValueBrew[1] ? this.visualStyleHelperService.measureOfValueBrew[1].colors : [];

    let countArray:any[] = [];
    colors[0].forEach( (color) => {
      countArray.push(this.visualStyleHelperService.featuresPerColorMap.get(color) || 0);
    });
    colors[1].forEach( (color) => {
      countArray.push(this.visualStyleHelperService.featuresPerColorMap.get(color) || 0);
    })
    let color = this.visualStyleHelperService.measureOfValueBrew[side].colors[i];
    let count = this.visualStyleHelperService.featuresPerColorMap.get(color);
    return (count / Math.max(...countArray)) * 100 || 0;
  };
  
 getWidthForHistogramBarDynamic(side, i) {
    let colors = [...this.visualStyleHelperService.dynamicBrew[0].colors, ...this.visualStyleHelperService.dynamicBrew[1].colors];
    let countArray:any[] = [];
    colors.forEach( (color) => {
      countArray.push(this.visualStyleHelperService.featuresPerColorMap.get(color) || 0);
    })
    let color = this.visualStyleHelperService.dynamicBrew[side].colors[i];
    let count = this.visualStyleHelperService.featuresPerColorMap.get(color);
    return (count / Math.max(...countArray)) * 100 || 0;
  };

 getHeightForBar(i) {
    let size = this.visualStyleHelperService.manualBrew.breaks[i+1] - this.visualStyleHelperService.manualBrew.breaks[i];
    return (size / (this.getMaxValue(0) -this.getMinValue(0))) * 100;
  };

 getHeightForBarMOV(site, i) {
    let size = this.visualStyleHelperService.measureOfValueBrew[site].breaks[i+1] - this.visualStyleHelperService.measureOfValueBrew[site].breaks[i];
    return (size / (this.getMaxValue(0) -this.getMinValue(1))) * 100;
  };

 getHeightForBarDynamic(site, i) {
    let size = this.visualStyleHelperService.dynamicBrew[site].breaks[i+1] - this.visualStyleHelperService.dynamicBrew[site].breaks[i];
    return (size / (this.getMaxValue(site) -this.getMinValue(site))) * 100;
  }; 

 getPercentage(n, site) {
    return ((n -this.getMinValue(site)) / (this.getMaxValue(site) -this.getMinValue(site))) * 100;
  };

  
 getMaxValue(site)  {
    let breaks = [];
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues)
      || this.exchangeData.isMeasureOfValueChecked) {
      breaks = this.visualStyleHelperService.manualBrew.breaks;
    }
    else {
      if (!this.visualStyleHelperService.dynamicBrew) {
        return 0;
      }
      if (!this.visualStyleHelperService.dynamicBrew[0] && !this.visualStyleHelperService.dynamicBrew[1]) {
        return 0;
      }
      if(site == 1 && (!this.visualStyleHelperService.dynamicBrew[1] || this.visualStyleHelperService.dynamicBrew[1].breaks.length < 1)) {
        breaks = this.visualStyleHelperService.dynamicBrew[0].breaks;
      }
      if(site == 0 && (!this.visualStyleHelperService.dynamicBrew[0] || this.visualStyleHelperService.dynamicBrew[0].breaks.length < 1)) {
        breaks = this.visualStyleHelperService.dynamicBrew[1].breaks;
      }
      breaks = this.visualStyleHelperService.dynamicBrew[site].breaks;
    }
    return breaks[breaks.length - 1]; 
  }  
 
 getMinValue(site) {
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues)
      || this.exchangeData.isMeasureOfValueChecked) {
      return this.visualStyleHelperService.manualBrew.breaks[0];
    }
    if (!this.visualStyleHelperService.dynamicBrew) {
      return 0;
    }
    if (!this.visualStyleHelperService.dynamicBrew[0] && !this.visualStyleHelperService.dynamicBrew[1]) {
      return 0;
    }
    if(site == 1 && (!this.visualStyleHelperService.dynamicBrew[1] || this.visualStyleHelperService.dynamicBrew[1].breaks.length < 1)) {
      return this.visualStyleHelperService.dynamicBrew[0].breaks[0];
    }
    if(site == 0 && (!this.visualStyleHelperService.dynamicBrew[0] || this.visualStyleHelperService.dynamicBrew[0].breaks.length < 1)) {
      return this.visualStyleHelperService.dynamicBrew[1].breaks[0];
    }
    return this.visualStyleHelperService.dynamicBrew[site].breaks[0];
  }
   
  onBreakMouseDown(e, i, site) {
    this.isDraggingBreak = true;
    this.draggingBreak = e.currentTarget;
    this.nrOfDraggingBreak = i;
    this.dynamicDraggingSite = site;
  }

  onClassificationMouseUp() {
    this.isDraggingBreak = false;
  }
    
 onBreaksMouseMove(e, site) {
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues)
      || this.exchangeData.isMeasureOfValueChecked) {
     this.onBreakMouseMove(e);
    }
    else {
     this.onDynamicBreakMouseMove(e, site);
    }
  }
  
 onBreakMouseMove(e) {
    if (this.nrOfDraggingBreak != 0 &&this.nrOfDraggingBreak != this.visualStyleHelperService.manualBrew.breaks.length-1 && this.nrOfDraggingBreak && !this.breakIsUnalterable(this.visualStyleHelperService.manualBrew.breaks[this.nrOfDraggingBreak])) {
     this.showAddBtn[0] = false;

      if(e.buttons === 1 &&this.isDraggingBreak) {
        let histogram = document.querySelectorAll<HTMLElement>(".editableHistogram")[0];
        let newHeight = this.addBtnHeight[0] / histogram.offsetHeight * 100;
        if(newHeight > 0 && newHeight < 100) {
          this.draggingBreak.style.top = newHeight + "%";
        }

        (async () => {
          let breaks = this.visualStyleHelperService.manualBrew.breaks;
          let newBreak = Math.floor((this.addBtnHeight[0] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
          if (newBreak > breaks[0] && newBreak < breaks[breaks.length-1]) {
           this.draggingBreak.children[0].children[0].value = newBreak;
            if(this.nrOfDraggingBreak)
              this.visualStyleHelperService.manualBrew.breaks[this.nrOfDraggingBreak] = newBreak;
            this.visualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
              return a - b;
            });
            
            this.broadcastService.broadcast("changeBreaks", [this.visualStyleHelperService.manualBrew.breaks]);
            if((this.exchangeData.isBalanceChecked 
              || this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
              ||this.containsNegativeValues) 
              && this.exchangeData.isMeasureOfValueChecked) {
             this.updateDynamicBreaksFromManualBreaks();
            }
          }
        })();
      }
    }
  };

 onDynamicBreakMouseMove(e, site) {
    if (this.nrOfDraggingBreak != 0 &&this.nrOfDraggingBreak != this.visualStyleHelperService.dynamicBrew[this.dynamicDraggingSite].breaks.length-1) {
     this.showAddBtn[site] = false;

      if(e.buttons === 1 &&this.isDraggingBreak) {
        let histograms = Array.from(document.querySelectorAll<HTMLElement>(".editableHistogram"));
        histograms.reverse();
        let histogram = histograms[this.dynamicDraggingSite];

        let newHeight = this.addBtnHeight[site] / histogram.offsetHeight * 100;
        if(newHeight > 0 && newHeight < 100) {
         this.draggingBreak.style.top = newHeight + "%";
        }

        (async () => {
          let breaks = this.visualStyleHelperService.dynamicBrew[this.dynamicDraggingSite].breaks;
          let newBreak = Math.floor((this.addBtnHeight[site] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
          if (newBreak > breaks[0] && newBreak < breaks[breaks.length-1] && !breaks.includes(newBreak)) {
           this.draggingBreak.children[0].children[0].value = newBreak;
            if(this.nrOfDraggingBreak)
              this.visualStyleHelperService.dynamicBrew[this.dynamicDraggingSite].breaks[this.nrOfDraggingBreak] = newBreak;
            this.visualStyleHelperService.dynamicBrew[this.dynamicDraggingSite].breaks.sort(function(a, b) {
              return a - b;
            });
            let increaseBreaks = this.visualStyleHelperService.dynamicBrew[0] ? this.visualStyleHelperService.dynamicBrew[0].breaks : [];
            let decreaseBreaks = this.visualStyleHelperService.dynamicBrew[1] ? this.visualStyleHelperService.dynamicBrew[1].breaks : [];
            
            this.broadcastService.broadcast("changeDynamicBreaks", [[increaseBreaks, decreaseBreaks]]);
          }
        })();
      }
    }
  } 
}
