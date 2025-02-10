import { Component, OnInit } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { VisualStyleHelperService } from 'services/visual-style-helper-service/visual-style-helper.service';
import { colorbrewer } from './colors';

@Component({
  selector: 'kommonitor-classification-component',
  templateUrl: './kommonitor-classification.component.html',
  styleUrls: ['./kommonitor-classification.component.css']
})
export class KommonitorClassificationComponent implements OnInit {

  exchangeData: DataExchange;
  visualStyleData: any;

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

 hiddenMethodIds = [];

 colorbrewerSchemes!:any;
 colorbrewerPalettes:any[] = [];

 selectedColorBrewerPaletteEntry!:any;

  constructor(
    private dataExchangeService: DataExchangeService,
    private visualStyleHelperService: VisualStyleHelperService
  ) {
    this.exchangeData = dataExchangeService.pipedData;
    this.visualStyleData = visualStyleHelperService.pipedData;
    console.log(this.visualStyleData);
  }

  ngOnInit(): void {
      
    this.instantiateColorBrewerPalettes();
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
/*
 $on("onChangeSelectedIndicator", function(event){
    for (const colorbrewerPalette ofcolorbrewerPalettes) {
      if (colorbrewerPalette.paletteName === this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName){
       selectedColorBrewerPaletteEntry = colorbrewerPalette;
        break;
      }
    }
  });
 */
  onClickColorBrewerEntry(colorPaletteEntry) {
    let selectedColorBrewerPaletteEntry = colorPaletteEntry;

    this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName = selectedColorBrewerPaletteEntry.paletteName;

    // todo
    //$rootScope.$broadcast("changeColorScheme", this.exchangeData.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName);
/* 
    setTimeout(() => {
     $digest();
    }, 250); */
  };
/* 

  $rootScope.$on("updateClassificationComponent", function(event, containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate) {
   containsZeroValues = containsZeroValues;
   containsNegativeValues = containsNegativeValues;
   containsOutliers_high = containsOutliers_high;
   containsOutliers_low = containsOutliers_low;
   containsNoData = containsNoData;
  });

  $rootScope.$on("updateShowRegionalDefaultOption", function(event, show) {
    if(show){
      if($scope.hiddenMethodIds.includes('regional_default')) {
       hiddenMethodIds.splice($scope.hiddenMethodIds.indexOf('regional_default'), 1);
      }
    }
    else {
      if(!$scope.hiddenMethodIds.includes('regional_default')) {
       hiddenMethodIds.push('regional_default');
      }
    }
  });

 hideManualClassification = function () {
    if(!$scope.hiddenMethodIds.includes('manual')) {
     hiddenMethodIds.push('manual');
    }
  }

  if(__env.disableManualClassification) {
   hideManualClassification();
  }

 onMethodSelected = function (method) {
   methodName = method.name;
   showMethodSelection = false;
    this.visualStyleData.classifyMethod = method.id;
    $rootScope.$broadcast("changeClassifyMethod", this.visualStyleData.classifyMethod);
  }
  
 onChangeSelectedClassifyMethod = function () {
    $rootScope.$broadcast("changeClassifyMethod", this.visualStyleData.classifyMethod);
  } 
  */
 onChangeNumberOfClasses() {
  // todo
    /* $rootScope.$broadcast("changeNumClasses", this.visualStyleData.numClasses); */
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
    if(this.visualStyleData.manualBrew.breaks.length <  10) {
      if(this.addBtnHeight[0] >= 0 &&this.addBtnHeight[0] < histogram.offsetHeight) {
        let breaks = this.visualStyleData.manualBrew.breaks;
        let newBreak = Math.floor((this.addBtnHeight[0] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
        if(!this.visualStyleData.manualBrew.breaks.includes(newBreak)) {
          this.visualStyleData.manualBrew.breaks.push(newBreak);
          this.visualStyleData.manualBrew.breaks.sort(function(a, b) {
            return a - b;
          });

          // todo
          //$rootScope.$broadcast("changeBreaks", this.visualStyleData.manualBrew.breaks);
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

    if(this.visualStyleData.dynamicBrew[site].breaks.length <  5) {
      if(this.addBtnHeight[site] >= 0 &&this.addBtnHeight[site] < histogram.offsetHeight) {
        let breaks = this.visualStyleData.dynamicBrew[site].breaks;
        let newBreak = Math.floor((this.addBtnHeight[site] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
        if(!this.visualStyleData.dynamicBrew[site].breaks.includes(newBreak)){
          this.visualStyleData.dynamicBrew[site].breaks.push(newBreak);
          this.visualStyleData.dynamicBrew[site].breaks.sort(function(a, b) {
            return a - b;
          });

          let increaseBreaks = this.visualStyleData.dynamicBrew[0] ? this.visualStyleData.dynamicBrew[0].breaks : [];
          let decreaseBreaks = this.visualStyleData.dynamicBrew[1] ? this.visualStyleData.dynamicBrew[1].breaks : [];
            // todo
          //$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks]);
        }
      }
    }
  }

 updateDynamicBreaksFromManualBreaks(){
    let increaseBreaks:any[] = [];
    let decreaseBreaks:any[] = [];
    this.visualStyleData.manualBrew.breaks.forEach((br) => {
      if (br < 0) {
        decreaseBreaks.push(br);
      }
      else {
        increaseBreaks.push(br);
      }
    });
    // todo
    //$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks]);
  }
 
 breakIsUnalterable(br) {
    if(this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      ||this.containsNegativeValues){
      if(this.visualStyleData.dynamicBrewBreaks) {
        if(this.visualStyleData.dynamicBrewBreaks[1]) {
          if(br == this.visualStyleData.dynamicBrewBreaks[1][0]){
            return true;
          }
          if(br == this.visualStyleData.dynamicBrewBreaks[1][this.visualStyleData.dynamicBrewBreaks[1].length-1]){
            return true;
          }
        }
        if(this.visualStyleData.dynamicBrewBreaks[0]) {
          if(br == this.visualStyleData.dynamicBrewBreaks[0][0]){
            return true;
          }
          if(br == this.visualStyleData.dynamicBrewBreaks[0][this.visualStyleData.dynamicBrewBreaks[0].length-1]){
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
        this.visualStyleData.manualBrew.breaks.splice(i, 1);
        // todo 
        // $rootScope.$broadcast("changeBreaks", this.visualStyleData.manualBrew.breaks);
        this.updateDynamicBreaksFromManualBreaks();
      }
      else {
        this.visualStyleData.dynamicBrew[site].breaks.splice(i, 1);
        let increaseBreaks = this.visualStyleData.dynamicBrew[0] ? this.visualStyleData.dynamicBrew[0].breaks : [];
        let decreaseBreaks = this.visualStyleData.dynamicBrew[1] ? this.visualStyleData.dynamicBrew[1].breaks : [];
        // todo
        // $rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks])
      }
    }

    else {
      this.visualStyleData.manualBrew.breaks.splice(i, 1);
      // todo
      // $rootScope.$broadcast("changeBreaks", this.visualStyleData.manualBrew.breaks);
    }
  }

 onBreaksChanged(e, i, site) {
    e.currentTarget.disabled = true;
    
    let breaks = [...this.visualStyleData.manualBrew.breaks];
    if(e.currentTarget.value <= breaks[0] || e.currentTarget.value >= breaks[breaks.length - 1] || breaks.includes(Number(e.currentTarget.value))) {
      e.currentTarget.value = breaks[i];

      // todo, wrap into timeout if necessary
      //setTimeout(function () {
          e.currentTarget.value = breaks[i];
          this.visualStyleData.manualBrew.breaks[i] = breaks[i];
      //}, 10);
    }
    else {
      this.visualStyleData.manualBrew.breaks[i] = Number(e.currentTarget.value);
      this.visualStyleData.manualBrew.breaks.sort(function(a, b) {
        return a - b;
      });

      // todo
      //$rootScope.$broadcast("changeBreaks", this.visualStyleData.manualBrew.breaks);
      
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
    
    let breaks = [...this.visualStyleData.dynamicBrew[site].breaks];
    if(e.currentTarget.value <= breaks[0] || e.currentTarget.value >= breaks[breaks.length - 1] || breaks.includes(Number(e.currentTarget.value))) {
      e.currentTarget.value = breaks[i];

      // todo, wrap in timeout if necessary
      /* setTimeout(function () {
       $apply(function(){ */
          e.currentTarget.value = breaks[i];
          this.visualStyleData.dynamicBrew[site].breaks[i] = breaks[i];
    /*     });
      }, 10); */
    }
    else {
      this.visualStyleData.dynamicBrew[site].breaks[i] = Number(e.currentTarget.value);
      this.visualStyleData.dynamicBrew[site].breaks.sort(function(a, b) {
        return a - b;
      });
      // todo
      //$rootScope.$broadcast("changeDynamicBreaks", [this.visualStyleData.dynamicBrew[0].breaks, this.visualStyleData.dynamicBrew[1].breaks]);
    }
  }

 onBreakDblClick(e, i, site) {
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues)
      || this.exchangeData.isMeasureOfValueChecked) {
      if (i == 0 || i == this.visualStyleData.manualBrew.breaks.length-1 || this.breakIsUnalterable(this.visualStyleData.manualBrew.breaks[i])) {
        return;
      }
    }
    else {
      if (i == 0 || i == this.visualStyleData.dynamicBrew[site].breaks.length-1 || this.breakIsUnalterable(this.visualStyleData.dynamicBrew[site].breaks[i])) {
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
  
 restyleCurrentLayer = function () {
  // todo
    //$rootScope.$broadcast("restyleCurrentLayer", false);
  }
 
 getWidthForHistogramBar(i) {
    let colors = this.visualStyleData.manualBrew.colors ? this.visualStyleData.manualBrew.colors : [];
    let countArray:any[] = [];
    colors.forEach( (color:any) => {
      countArray.push(this.visualStyleData.featuresPerColorMap.get(color) || 0);
    });
    return (countArray[i] / Math.max(...countArray)) * 100 || 0;
  };
 getWidthForHistogramBarMOV(side, i) {
    let colors:any[] = [];
    colors[0] = this.visualStyleData.measureOfValueBrew[0] ? this.visualStyleData.measureOfValueBrew[0].colors : [];
    colors[1] = this.visualStyleData.measureOfValueBrew[1] ? this.visualStyleData.measureOfValueBrew[1].colors : [];

    let countArray:any[] = [];
    colors[0].forEach( (color) => {
      countArray.push(this.visualStyleData.featuresPerColorMap.get(color) || 0);
    });
    colors[1].forEach( (color) => {
      countArray.push(this.visualStyleData.featuresPerColorMap.get(color) || 0);
    })
    let color = this.visualStyleData.measureOfValueBrew[side].colors[i];
    let count = this.visualStyleData.featuresPerColorMap.get(color);
    return (count / Math.max(...countArray)) * 100 || 0;
  };
  
 getWidthForHistogramBarDynamic(side, i) {
    let colors = [...this.visualStyleData.dynamicBrew[0].colors, ...this.visualStyleData.dynamicBrew[1].colors];
    let countArray:any[] = [];
    colors.forEach( (color) => {
      countArray.push(this.visualStyleData.featuresPerColorMap.get(color) || 0);
    })
    let color = this.visualStyleData.dynamicBrew[side].colors[i];
    let count = this.visualStyleData.featuresPerColorMap.get(color);
    return (count / Math.max(...countArray)) * 100 || 0;
  };

 getHeightForBar(i) {
    let size = this.visualStyleData.manualBrew.breaks[i+1] - this.visualStyleData.manualBrew.breaks[i];
    return (size / (this.getMaxValue(0) -this.getMinValue(0))) * 100;
  };

 getHeightForBarMOV(site, i) {
    let size = this.visualStyleData.measureOfValueBrew[site].breaks[i+1] - this.visualStyleData.measureOfValueBrew[site].breaks[i];
    return (size / (this.getMaxValue(0) -this.getMinValue(1))) * 100;
  };

 getHeightForBarDynamic(site, i) {
    let size = this.visualStyleData.dynamicBrew[site].breaks[i+1] - this.visualStyleData.dynamicBrew[site].breaks[i];
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
      breaks = this.visualStyleData.manualBrew.breaks;
    }
    else {
      if (!this.visualStyleData.dynamicBrew) {
        return 0;
      }
      if (!this.visualStyleData.dynamicBrew[0] && !this.visualStyleData.dynamicBrew[1]) {
        return 0;
      }
      if(site == 1 && (!this.visualStyleData.dynamicBrew[1] || this.visualStyleData.dynamicBrew[1].breaks.length < 1)) {
        breaks = this.visualStyleData.dynamicBrew[0].breaks;
      }
      if(site == 0 && (!this.visualStyleData.dynamicBrew[0] || this.visualStyleData.dynamicBrew[0].breaks.length < 1)) {
        breaks = this.visualStyleData.dynamicBrew[1].breaks;
      }
      breaks = this.visualStyleData.dynamicBrew[site].breaks;
    }
    return breaks[breaks.length - 1]; 
  }  
 
 getMinValue(site) {
    if((!this.exchangeData.isBalanceChecked 
      && !this.exchangeData.selectedIndicator.indicatorType.includes('DYNAMIC')
      && !this.containsNegativeValues)
      || this.exchangeData.isMeasureOfValueChecked) {
      return this.visualStyleData.manualBrew.breaks[0];
    }
    if (!this.visualStyleData.dynamicBrew) {
      return 0;
    }
    if (!this.visualStyleData.dynamicBrew[0] && !this.visualStyleData.dynamicBrew[1]) {
      return 0;
    }
    if(site == 1 && (!this.visualStyleData.dynamicBrew[1] || this.visualStyleData.dynamicBrew[1].breaks.length < 1)) {
      return this.visualStyleData.dynamicBrew[0].breaks[0];
    }
    if(site == 0 && (!this.visualStyleData.dynamicBrew[0] || this.visualStyleData.dynamicBrew[0].breaks.length < 1)) {
      return this.visualStyleData.dynamicBrew[1].breaks[0];
    }
    return this.visualStyleData.dynamicBrew[site].breaks[0];
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
    if (this.nrOfDraggingBreak != 0 &&this.nrOfDraggingBreak != this.visualStyleData.manualBrew.breaks.length-1 && this.nrOfDraggingBreak && !this.breakIsUnalterable(this.visualStyleData.manualBrew.breaks[this.nrOfDraggingBreak])) {
     this.showAddBtn[0] = false;

      if(e.buttons === 1 &&this.isDraggingBreak) {
        let histogram = document.querySelectorAll<HTMLElement>(".editableHistogram")[0];
        let newHeight = this.addBtnHeight[0] / histogram.offsetHeight * 100;
        if(newHeight > 0 && newHeight < 100) {
          this.draggingBreak.style.top = newHeight + "%";
        }

        (async () => {
          let breaks = this.visualStyleData.manualBrew.breaks;
          let newBreak = Math.floor((this.addBtnHeight[0] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
          if (newBreak > breaks[0] && newBreak < breaks[breaks.length-1]) {
           this.draggingBreak.children[0].children[0].value = newBreak;
            if(this.nrOfDraggingBreak)
              this.visualStyleData.manualBrew.breaks[this.nrOfDraggingBreak] = newBreak;
            this.visualStyleData.manualBrew.breaks.sort(function(a, b) {
              return a - b;
            });
            // todo
            //$rootScope.$broadcast("changeBreaks", this.visualStyleData.manualBrew.breaks);
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
    if (this.nrOfDraggingBreak != 0 &&this.nrOfDraggingBreak != this.visualStyleData.dynamicBrew[this.dynamicDraggingSite].breaks.length-1) {
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
          let breaks = this.visualStyleData.dynamicBrew[this.dynamicDraggingSite].breaks;
          let newBreak = Math.floor((this.addBtnHeight[site] / histogram.offsetHeight) * (breaks[breaks.length-1] - breaks[0]) + breaks[0]);
          if (newBreak > breaks[0] && newBreak < breaks[breaks.length-1] && !breaks.includes(newBreak)) {
           this.draggingBreak.children[0].children[0].value = newBreak;
            if(this.nrOfDraggingBreak)
              this.visualStyleData.dynamicBrew[this.dynamicDraggingSite].breaks[this.nrOfDraggingBreak] = newBreak;
            this.visualStyleData.dynamicBrew[this.dynamicDraggingSite].breaks.sort(function(a, b) {
              return a - b;
            });
            let increaseBreaks = this.visualStyleData.dynamicBrew[0] ? this.visualStyleData.dynamicBrew[0].breaks : [];
            let decreaseBreaks = this.visualStyleData.dynamicBrew[1] ? this.visualStyleData.dynamicBrew[1].breaks : [];
            // todo
            //$rootScope.$broadcast("changeDynamicBreaks", [increaseBreaks, decreaseBreaks]);
          }
        })();
      }
    }
  } 
}
