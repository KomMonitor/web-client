angular.module('kommonitorReachabilityScenarioHelper', ['kommonitorDataExchange', 'kommonitorReachabilityHelper']);

angular
  .module('kommonitorReachabilityScenarioHelper')
  .service(
    'kommonitorReachabilityScenarioHelperService', ['__env', '$rootScope',
    'kommonitorDataExchangeService', 'kommonitorReachabilityHelperService',
    function (__env, $rootScope, kommonitorDataExchangeService, kommonitorReachabilityHelperService ) {

      var self = this;

      /* list of reachabilityScenarios with objects like
        {
          "reachabilitySettings": reachabilitySettings, // settings from rechability helper service for isochrone config
          "scenarioName": "name", // unique scenario name
          "indicatorStatistics": indicatorStatistics, // array of all calculated indicator statistics
          "isochrones_dissolved": isochrones_dissolved, // kommonitorReachabilityHelperService.currentIsochronesGeoJSON 
          "isochrones_perPoint": isochrones_perPoint, //kommonitorReachabilityHelperService.original_nonDissolved_isochrones 
        }
        */
      this.reachabilityScenarios = [];

      this.tmpActiveScenario = {
        "reachabilitySettings": {}, // settings from rechability helper service for isochrone config
          "scenarioName": "", // unique scenario name
          "indicatorStatistics": [], // array of all calculated indicator statistics
          "isochrones_dissolved": {}, // kommonitorReachabilityHelperService.currentIsochronesGeoJSON 
          "isochrones_perPoint": {}, //kommonitorReachabilityHelperService.original_nonDissolved_isochrones
      };

      this.resetTmpActiveScenario = function(){
        this.tmpActiveScenario = {
          "reachabilitySettings": {}, // settings from rechability helper service for isochrone config
            "scenarioName": "", // unique scenario name
            "indicatorStatistics": [], // array of all calculated indicator statistics
            "isochrones_dissolved": {}, // kommonitorReachabilityHelperService.currentIsochronesGeoJSON 
            "isochrones_perPoint": {}, //kommonitorReachabilityHelperService.original_nonDissolved_isochrones
        };
      }

      this.setActiveScenario = function(scenarioDataset){
        this.tmpActiveScenario = scenarioDataset;

        kommonitorReachabilityHelperService.settings = this.tmpActiveScenario.reachabilitySettings;
        kommonitorReachabilityHelperService.currentIsochronesGeoJSON = this.tmpActiveScenario.isochrones_dissolved;
        kommonitorReachabilityHelperService.original_nonDissolved_isochrones = this.tmpActiveScenario.isochrones_perPoint;
      }

      this.loadActiveScenario = function(scenarioDataset){
        this.setActiveScenario(scenarioDataset);
        // since the config contains all info for active scenario we just reload all reachability maps        
				$rootScope.$broadcast("isochronesCalculationFinished", true);
			}

      this.addReachabilityScenario = function(){
        this.tmpActiveScenario.reachabilitySettings = kommonitorReachabilityHelperService.settings;
        this.tmpActiveScenario.isochrones_dissolved = kommonitorReachabilityHelperService.currentIsochronesGeoJSON;
        this.tmpActiveScenario.isochrones_perPoint = kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
        // this.tmpActiveScenario.indicatorStatistics and this.tmpActiveScenario.scenarioName are already directly set within reachability components 

        this.replaceOrAddScenario(JSON.parse(JSON.stringify(this.tmpActiveScenario)));        
      }

      this.replaceOrAddScenario = function(scenario){
        // remove AngularJS key
        delete scenario['$$hashKey']; 
        let replaced = false;
        for (let i=0; i < this.reachabilityScenarios.length; i++) {
          if(this.reachabilityScenarios[i].scenarioName == scenario.scenarioName){
            this.reachabilityScenarios.splice(i, 1, scenario);
            replaced = true;
            break;
          }           
        }

        if (! replaced){
          this.reachabilityScenarios.push(scenario);
        }
      }

      this.cloneReachabilityScenario = function(scenario){
        let clone = JSON.parse(JSON.stringify(scenario));

        // remove angulraJS hashkey identifying the entry
        delete clone['$$hashKey']; 

        clone.scenarioName = "Kopie - " + clone.scenarioName;
        this.reachabilityScenarios.push(clone);
      }

      this.removeReachabilityScenario = function(scenario){

        for (let i=0; i < this.reachabilityScenarios.length; i++) {
          if(this.reachabilityScenarios[i].scenarioName == scenario.scenarioName){
            this.reachabilityScenarios.splice(i, 1);
            break;
          } 
        }
      }

      this.exportScenarios = function(){
        var scenarios_string = JSON
					.stringify(this.reachabilityScenarios);

				var fileName = 'Erreichbarkeitsszenarien_KomMonitor.json';

				var blob = new Blob([scenarios_string], {
					type: 'application/json'
				});
				var data = URL.createObjectURL(blob);

				var a = document.createElement('a');
				a.download = fileName;
				a.href = data;
				a.textContent = "JSON";
				a.target = "_self";
				a.rel = "noopener noreferrer";
				a.click()
				a.remove();
      }

      this.onImportScenariosFile = function(){
  
        $("#reachabilityScenariosImportFile").files = [];
  
        // trigger file chooser
        $("#reachabilityScenariosImportFile").click();
  
      };
  
      $(document).on("change", "#reachabilityScenariosImportFile" ,function(){
  
        // get the file
        var file = document.getElementById('reachabilityScenariosImportFile').files[0];
        self.parseReachabilityScenariosFromFile(file);
      });
  
      this.parseReachabilityScenariosFromFile = function(file){
        var fileReader = new FileReader();
  
        fileReader.onload = function(event) {
  
          try{
            self.parseFromFile(event);
          }
          catch(error){
            console.error("Uploaded Reachability Scnearios File cannot be parsed.");  
          }
  
        };
  
        // Read in the image file as a data URL.
        fileReader.readAsText(file);
      };
  
      this.parseFromFile = function(event){
        this.reachabilityScenarios = JSON.parse(event.target.result);
        $rootScope.$digest();
      }

    }]);
