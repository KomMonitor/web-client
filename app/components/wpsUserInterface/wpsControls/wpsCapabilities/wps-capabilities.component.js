angular
		.module('wpsCapabilities')
		.component(
				'wpsCapabilities',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsCapabilities/wps-capabilities.template.html",
					controller : ['wpsPropertiesService', function WpsCapabilitiesController(
							wpsPropertiesService) {

								this.selectedResourceType = 'spatialUnits';

								this.onClickDataManagement = function(resourceType){
									this.selectedResourceType = resourceType;

									switch(resourceType) {
									    case 'spatialUnits':
													document.getElementById('spatialUnitManagement').setAttribute("class", "active");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "");
									        break;
									    case 'georesources':
													document.getElementById('spatialUnitManagement').setAttribute("class", "");
													document.getElementById('georesourceManagement').setAttribute("class", "active");
													document.getElementById('indicatorManagement').setAttribute("class", "");
									        break;
											case 'indicators':
													document.getElementById('spatialUnitManagement').setAttribute("class", "");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "active");
										      break;
									    default:
													document.getElementById('spatialUnitManagement').setAttribute("class", "active");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "");
									}
								};

					}
				]});
