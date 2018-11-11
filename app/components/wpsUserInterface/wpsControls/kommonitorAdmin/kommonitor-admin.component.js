angular
		.module('kommonitorAdmin')
		.component(
				'kommonitorAdmin',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/kommonitorAdmin/kommonitor-admin.template.html",
					controller : ['wpsPropertiesService', function kommonitorAdminController(
							wpsPropertiesService) {

								this.selectedResourceType = 'spatialUnits';

								this.onClickDataManagement = function(resourceType){
									this.selectedResourceType = resourceType;

									switch(resourceType) {
									    case 'spatialUnits':
													document.getElementById('spatialUnitManagement').setAttribute("class", "active");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "");
													document.getElementById('scriptManagement').setAttribute("class", "");
									        break;
									    case 'georesources':
													document.getElementById('spatialUnitManagement').setAttribute("class", "");
													document.getElementById('georesourceManagement').setAttribute("class", "active");
													document.getElementById('indicatorManagement').setAttribute("class", "");
													document.getElementById('scriptManagement').setAttribute("class", "");
									        break;
											case 'indicators':
													document.getElementById('spatialUnitManagement').setAttribute("class", "");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "active");
													document.getElementById('scriptManagement').setAttribute("class", "");
										      break;
											case 'scripts':
													document.getElementById('spatialUnitManagement').setAttribute("class", "");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "");
													document.getElementById('scriptManagement').setAttribute("class", "active");
													break;
									    default:
													document.getElementById('spatialUnitManagement').setAttribute("class", "active");
													document.getElementById('georesourceManagement').setAttribute("class", "");
													document.getElementById('indicatorManagement').setAttribute("class", "");
									}
								};

					}
				]});
