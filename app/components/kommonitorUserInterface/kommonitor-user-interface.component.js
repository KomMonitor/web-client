"use strict";
angular.module('kommonitorUserInterface').component('kommonitorUserInterface', {
    templateUrl: "components/kommonitorUserInterface/kommonitor-user-interface.template.html",
    controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', 'kommonitorElementVisibilityHelperService', '$scope',
        '$rootScope', '$location', 'Auth', 'ControlsConfigService', '$compile', 'kommonitorShareHelperService', '__env',
        function UserInterfaceController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, kommonitorElementVisibilityHelperService, $scope, $rootScope, $location, Auth, ControlsConfigService, $compile, kommonitorShareHelperService, __env) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;
            this.kommonitorElementVisibilityHelperServiceInstance = kommonitorElementVisibilityHelperService;
            kommonitorDataExchangeService.anySideBarIsShown = false;
            kommonitorDataExchangeService.currentKeycloakUser;
            $scope.password;
            $scope.showAdminLogin = false;
            $scope.init = async function () {
                // initialize application
                console.log("Initialize Application");
                if ($scope.authenticated) {
                    console.log("Authetication successfull");
                }
                await checkAuthentication();
                kommonitorShareHelperService.init();
                kommonitorDataExchangeService.fetchAllMetadata();
            };
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            $scope.sidebarIndicatorConfigClass = "disappear";
            $scope.sidebarDiagramsClass = "disappear";
            $scope.sidebarRadarDiagramClass = "disappear";
            $scope.sidebarProcessingClass = "disappear";
            $scope.sidebarRegressionDiagramClass = "disappear";
            $scope.sidebarFilterClass = "disappear";
            $scope.sidebarBalanceClass = "disappear";
            $scope.sidebarReachabilityClass = "disappear";
            $scope.sidebarPoiClass = "disappear";
            $scope.sidebarDataImportClass = "disappear";
            $scope.sidebarLegendClass = "";
            $scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
            $scope.buttonDiagramsClass = "btn btn-custom btn-circle";
            $scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
            $scope.buttonProcessingClass = "btn btn-custom btn-circle";
            $scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
            $scope.buttonFilterClass = "btn btn-custom btn-circle";
            $scope.buttonBalanceClass = "btn btn-custom btn-circle";
            $scope.buttonReachabilityClass = "btn btn-custom btn-circle";
            $scope.buttonPoiClass = "btn btn-custom btn-circle";
            $scope.buttonDataImportClass = "btn btn-custom btn-circle";
            $scope.buttonLegendClass = "btn btn-custom-docked-right btn-docked-right";
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            Auth.keycloak.onAuthLogout = function () {
                console.log("Logout successfull");
                checkAuthentication();
            };
            Auth.keycloak.onAuthSuccess = function () {
                console.log("User successfully authenticated");
                checkAuthentication();
            };
            $scope.tryLoginUser_withoutKeycloak = function () {
                // TODO FIXME make generic user login once user/role concept is implemented
                // currently only simple ADMIN user login is possible
                console.log("Check user login");
                if (kommonitorDataExchangeService.adminUserName === kommonitorDataExchangeService.currentKeycloakUser && kommonitorDataExchangeService.adminPassword === $scope.password) {
                    // success login --> currently switch to ADMIN page directly
                    console.log("User Login success - redirect to Admin Page");
                    kommonitorDataExchangeService.adminIsLoggedIn = true;
                    $location.path('/administration');
                }
            };
            $scope.tryLoginUser = function () {
                if (kommonitorDataExchangeService.enableKeycloakSecurity) {
                    Auth.keycloak.login();
                }
                else {
                    $scope.tryLoginUser_withoutKeycloak();
                }
            };
            $scope.tryLogoutUser = function () {
                Auth.keycloak.logout();
            };
            $scope.tryLoginUserByKeypress = function ($event) {
                var keyCode = $event.which || $event.keyCode;
                //check for enter key
                if (keyCode === 13) {
                    $scope.tryLoginUser();
                }
            };
            var checkAuthentication = async function () {
                kommonitorDataExchangeService.currentKeycloakLoginRoles = [];
                if (Auth.keycloak.authenticated) {
                    $scope.authenticated = Auth.keycloak.authenticated;
                    if (Auth.keycloak.tokenParsed
                        && Auth.keycloak.tokenParsed.realm_access
                        && Auth.keycloak.tokenParsed.realm_access.roles
                        && Auth.keycloak.tokenParsed.realm_access.roles.some(role => role.endsWith("-creator") || role.endsWith("-publisher") || role.endsWith("-editor"))) {
                        Auth.keycloak.showAdminView = true;
                        $scope.showAdminLogin = true;
                    }
                }
            };
            $scope.openAdminUI = function () {
                $location.path('/administration');
            };
            $scope.undockButtons = function () {
                $scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
                $scope.buttonDiagramsClass = "btn btn-custom btn-circle";
                $scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
                $scope.buttonProcessingClass = "btn btn-custom btn-circle";
                $scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
                $scope.buttonFilterClass = "btn btn-custom btn-circle";
                $scope.buttonBalanceClass = "btn btn-custom btn-circle";
                $scope.buttonReachabilityClass = "btn btn-custom btn-circle";
                $scope.buttonPoiClass = "btn btn-custom btn-circle";
                $scope.buttonDataImportClass = "btn btn-custom btn-circle";
                // in addition check if balance menue and button are allowed for current indicator
                // it is not allowed if indicator is of type "DYNAMIC"
                $scope.checkBalanceButtonAndMenueState();
            };
            $scope.hideSidebars = function () {
                $scope.sidebarIndicatorConfigClass = "disappear";
                $scope.sidebarDiagramsClass = "disappear";
                $scope.sidebarRadarDiagramClass = "disappear";
                $scope.sidebarProcessingClass = "disappear";
                $scope.sidebarRegressionDiagramClass = "disappear";
                $scope.sidebarFilterClass = "disappear";
                $scope.sidebarBalanceClass = "disappear";
                $scope.sidebarReachabilityClass = "disappear";
                $scope.sidebarPoiClass = "disappear";
                $scope.sidebarDataImportClass = "disappear";
            };
            $scope.checkBalanceButtonAndMenueState = function () {
                // disable if indicator is dynamic or if indicator only contains 1 or less timeseries entries
                if (kommonitorDataExchangeService.selectedIndicator && (kommonitorDataExchangeService.selectedIndicator.indicatorType.includes("DYNAMIC") || kommonitorDataExchangeService.selectedIndicator.applicableDates.length < 2)) {
                    $scope.buttonBalanceClass = "btn btn-custom btn-circle disabled";
                    $scope.sidebarBalanceClass = "disappear";
                }
                else {
                    $scope.buttonBalanceClass = "btn btn-custom btn-circle";
                }
            };
            $scope.$on("checkBalanceMenueAndButton", function (event) {
                $scope.checkBalanceButtonAndMenueState();
            });
            $scope.onSidebarIndicatorButtonClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarIndicatorConfigClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarIndicatorConfigClass = "";
                    $scope.buttonIndicatorConfigClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                }
                else {
                    $scope.sidebarIndicatorConfigClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarPoiButtonClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarPoiClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarPoiClass = "";
                    $scope.buttonPoiClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                }
                else {
                    $scope.sidebarPoiClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarDataImportButtonClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarDataImportClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarDataImportClass = "";
                    $scope.buttonDataImportClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                }
                else {
                    $scope.sidebarDataImportClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarFilterButtonClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarFilterClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarFilterClass = "";
                    $scope.buttonFilterClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                }
                else {
                    $scope.sidebarFilterClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarBalanceButtonClick = function () {
                // check if button is marked as disabled
                if ($scope.buttonBalanceClass.includes("disabled")) {
                    // do nothing
                    return;
                }
                else {
                    $scope.undockButtons();
                    if ($scope.sidebarBalanceClass === "disappear") {
                        $scope.hideSidebars();
                        $scope.sidebarBalanceClass = "";
                        $scope.buttonBalanceClass = "btn btn-custom-docked btn-docked";
                        if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                            $rootScope.$broadcast("recenterMapOnShowSideBar");
                        }
                        kommonitorDataExchangeService.anySideBarIsShown = true;
                    }
                    else {
                        $scope.sidebarBalanceClass = "disappear";
                        $rootScope.$broadcast("recenterMapOnHideSideBar");
                        kommonitorDataExchangeService.anySideBarIsShown = false;
                    }
                    $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                    $rootScope.$broadcast("redrawGuidedTourElement");
                }
            };
            $scope.onSidebarReachabilityButtonClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarReachabilityClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarReachabilityClass = "";
                    $scope.buttonReachabilityClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                }
                else {
                    $scope.sidebarReachabilityClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarDiagramsClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarDiagramsClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarDiagramsClass = "";
                    $scope.buttonDiagramsClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                    $rootScope.$broadcast("resizeDiagrams");
                }
                else {
                    $scope.sidebarDiagramsClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarRadarDiagramClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarRadarDiagramClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarRadarDiagramClass = "";
                    $scope.buttonRadarDiagramClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                    $rootScope.$broadcast("resizeDiagrams");
                }
                else {
                    $scope.sidebarRadarDiagramClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarProcessingClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarProcessingClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarProcessingClass = "";
                    $scope.buttonProcessingClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                }
                else {
                    $scope.sidebarProcessingClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarRegressionDiagramClick = function () {
                $scope.undockButtons();
                if ($scope.sidebarRegressionDiagramClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarRegressionDiagramClass = "";
                    $scope.buttonRegressionDiagramClass = "btn btn-custom-docked btn-docked";
                    if (kommonitorDataExchangeService.anySideBarIsShown === false) {
                        $rootScope.$broadcast("recenterMapOnShowSideBar");
                    }
                    kommonitorDataExchangeService.anySideBarIsShown = true;
                    $rootScope.$broadcast("resizeDiagrams");
                }
                else {
                    $scope.sidebarRegressionDiagramClass = "disappear";
                    $rootScope.$broadcast("recenterMapOnHideSideBar");
                    kommonitorDataExchangeService.anySideBarIsShown = false;
                }
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
                $rootScope.$broadcast("redrawGuidedTourElement");
            };
            $scope.onSidebarLegendButtonClick = function () {
                if ($scope.sidebarLegendClass === "disappear") {
                    $scope.hideSidebars();
                    $scope.sidebarLegendClass = "";
                    $scope.buttonLegendClass = "btn btn-custom-docked-right btn-docked-right";
                }
                else {
                    $scope.sidebarLegendClass = "disappear";
                    $scope.buttonLegendClass = "btn btn-custom-right btn-circle-right";
                }
                $rootScope.$broadcast("invalidateMapSize");
                $rootScope.$broadcast("refreshIndicatorValueRangeSlider");
            };
            $scope.onRecenterMapButtonClick = function () {
                $rootScope.$broadcast("recenterMapContent");
            };
            $scope.onExportMapButtonClick = function () {
                $rootScope.$broadcast("exportMap");
            };
            $scope.onUnselectFeaturesButtonClick = function () {
                $rootScope.$broadcast("unselectAllFeatures");
            };
            $scope.onToggleInfoControlButtonClick = function () {
                $rootScope.$broadcast("toggleInfoControl");
            };
            $scope.onToggleLegendControlButtonClick = function () {
                $rootScope.$broadcast("toggleLegendControl");
            };
            $scope.$on("startGuidedTour", function (event) {
                $scope.startGuidedTour();
            });
            $scope.tourOptions = {
                container: "body",
                backdrop: true,
                backdropContainer: "body",
                smartPlacement: false,
                onEnd: function (tour) {
                    kommonitorDataExchangeService.guidedTour = undefined;
                },
                template: "<div class='popover tour'> <div class='arrow'></div> <h3 class='popover-title'></h3>  <div class='popover-content'></div><div class='popover-navigation'> <div class='btn-group'> <button class='btn btn-sm btn-default' data-role='prev'>« Zur&uuml;ck</button> <button class='btn btn-sm btn-default' data-role='next'>Weiter »</button> </div> <button class='btn btn-sm btn-default' data-role='end'>Guided Tour beenden</button></div></div>",
                steps: [
                    {
                        element: "#map",
                        title: "Willkommen zur Guided Tour von KomMonitor",
                        placement: "left",
                        content: "In dieser Tour werden die Funktionalitäten der Weboberfläche erläutert. Hier werden sie mit den Elementen der Oberfläche sowie den verschiedenen Buttons vertraut gemacht. " +
                            "</br> Die Tour kann jederzeit über den Button <b>Guided Tour beenden </b> verlassen werden. ",
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#sidebarLegendCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#map",
                        title: "Inhaltsverzeichnis",
                        placement: "top",
                        content: "<ol id='guided-tour-toc'></ol>",
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#sidebarLegendCollapse").click();
                            }
                        },
                        onShown: function (tour) {
                            $scope.generateTableOfContent();
                        }
                    },
                    {
                        element: "#header",
                        title: "Kopfzeile",
                        placement: "bottom",
                        content: "In der Kopfzeile befinden sich neben den Logos und dem Titel der Webanwendung mehrere Buttons. </br>" +
                            "Mit <label class='switch'><input disabled type='checkbox' checked><span class='switchslider round' style='cursor:default'></span></label> kann zwischen einer <b>vereinfachten</b> und einer <b>erweiterten Ansicht</b> gewechselt werden. </br>" +
                            "Diese Guided Tour kann stets erneut mit <span class='glyphicon glyphicon-play'></span> aufgerufen werden. " +
                            "<span class='glyphicon glyphicon-info-sign'></span> &ouml;ffnet das beim Aufruf der Seite erschienene Informationsfenster und</br>" +
                            "<i class='fas fa-user-cog'></i> erm&ouml;glicht mit entsprechenden Zugangsdaten den <b>Zugang zur Administrationsoberfläche</b>."
                    },
                    {
                        element: "#map",
                        title: "Kartenfenster",
                        placement: "top",
                        content: "Die Standardansicht besteht aus einer <b>kartografischen Darstellung</b>, die bereits eine Hintergrundkarte und einen Indikator anzeigt. In dieser Darstellung k&ouml;nnen Sie in der " +
                            "<b>Karte frei navigieren (zoomen, verschieben)</b> und beim <i>Her&uuml;berfahren mit dem Mauszeiger &uuml;ber eine der Raumeinheiten</i> werden der <b>Name</b>, der <b>Wert</b> und die <b>Einheit<b> des dargestellten Indikators angezeigt.",
                        // onNext: function(tour){
                        // 	// make sure that legend control is displayed
                        // 	var control = document.getElementById("legendControl");
                        // 	var controlButton = document.getElementById("toggleLegendControlButton");
                        // 	if(control.style.display === "none" || (controlButton.style.display !== undefined && controlButton.style.display !== "none")){
                        // 		$rootScope.$broadcast("toggleLegendControl");
                        // 	}
                        // },
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass === "disappear") {
                                $("#sidebarLegendCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorLegend",
                        title: "Indikatorenlegende und Klassifizierung",
                        placement: "left",
                        content: "Dieses Element ist in drei Teilbereiche untergliedert, welche </br>1. die wichtigsten <b>Metadaten</b> des dargestellten Indikator abbilden, </br>" +
                            "2. <b>Kartenlegenden</b> zur Interpretation der Karteninhalte anbieten und</br> 3. weitergehende M&ouml;glichkeiten zur <b>Klassifizierung</b> bieten.",
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#legendSymbologyCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#sidebarLegendCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorIndicatorBasicMetadata",
                        title: "Indikator-Metadaten, Einstellung- und Exportmöglichkeiten",
                        placement: "left",
                        content: "Im oberen Bereich sind der <b>Name</b> eine kurze <b>Beschreibung</b> sowie das <b>Fortf&uuml;hrungsintervall</b> des angezeigten Indikators zu finden. </br>" +
                            "Im mittleren Bereich kann die angezeigte <b>Raumebene per Dropdown-Liste gewechselt</b>, der <b>Zeitpunkt per Kalenderauswahl gewählt</b> sowie </br>" +
                            "die <b>Transparenz der Kartendarstellung per Schieberegler angepasst</b> werden. </br>" +
                            "Der untere Bereich bietet <b>Exportm&ouml;glichkeiten</b> f&uuml;r die angezeigten Daten in den Formaten <i>GeoJSON, ESRI Shapefile sowie CSV</i>. </br>" +
                            "Zudem kann ein <b>Metadatenblatt</b> aller Metadaten des dargestellten Indikators als <i>PDF-Datei</i> heruntergeladen werden.",
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#indicatorBasicMetadataCollapse").click();
                                $("#legendSymbologyCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#legendSymbologyCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorLegendSymbology",
                        title: "Kartenlegenden und Interpretation",
                        placement: "left",
                        content: "Dieser Bereich beinhaltet eine <b>Farblegende mit f&uuml;nf Klassen</b> f&uuml;r den angezeigten Indikator sowie die <b>Wertebereiche und Fallzahlen je Klasse</b></br> " +
                            "Als erg&auml;nzende Informationen werden der <b>Indikatortyp</b>, der <b>Stichtag</b>, die <b>Einheit</b> sowie eine kurze <b>Interpretationshilfe angezeigt.</b></br>" +
                            "Die einzelnen Reiter ganz oben erm&ouml;glichen den Wechsel zwischen verschiedenen Legenden, sofern zus&auml;tzlich zu einem <i>Indikator</i> </br>" +
                            "auch die Legende f&uuml;r berechnete <i>Isochronen</i>, ein <i>Routingergebnis</i> oder einen eingebundenen <i>WMS-Dienst</i> angezeigt werden sollen.",
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#legendSymbologyCollapse").click();
                                $("#indicatorClassificationCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#legendSymbologyCollapse").click();
                                $("#indicatorBasicMetadataCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorIndicatorClassification",
                        title: "Klassifikationsoptionen",
                        placement: "left",
                        content: "Hier kann zwischen den drei <b>Klassifizierungsmethoden</b> <i>Jenks, Gleiches Intervall und Quantile</i> gew&auml;hlt werden </br>" +
                            "<br/>Detaillierte Informationen zu den Klassifizierungsmethoden k&ouml;nnen dem <b>Popup</b> entnommen werden, das beim Herüberfahren mit dem Mauszeiger &uuml;ber eine der drei Optionen erscheint. " +
                            "<br/>Zudem l&auml;sst sich per <label class='switch'><input disabled type='checkbox' checked><span class='switchslider round' style='cursor:default'></span></label> einstellen, ob die Klassifizierung die Indikatorenwerte der gesamten Zeitreihe ber&uuml;cksichtigen soll, oder nur jene des aktuellen Zeitschnitts. </br>" +
                            "So kann ein vergleichbares Kartenbild f&uuml;r eine komplette Zeitreihe gew&auml;hrleistet werden. </br>" +
                            "<br/>KomMonitor &uuml;berpr&uuml;ft jeden Indikatorendatensatz auf <b>statistische Ausrei&szlig;er</b>. Werden ein oder mehrere Ausrei&szlig;er erkannt, so können mit  <label class='switch'><input disabled type='checkbox' checked><span class='switchslider round' style='cursor:default'></span></label> " +
                            "<i>Ausrei&szlig;er gesondert markiert und </br>aus der Klassifizierung entfernt werden</i>. Dies kann hilfreich sein, " +
                            "um ein differenzierteres Kartenbild zu erzeugen.",
                        onNext: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#sidebarLegendCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarLegendClass !== "disappear") {
                                $("#legendSymbologyCollapse").click();
                                $("#indicatorClassificationCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#dateSliderWrapper",
                        title: "Zeitstrahl",
                        placement: "top",
                        content: "Die <b>Zeitleiste</b> am unteren Bildschirmrand enth&auml;lt die <b>verf&uuml;gbaren Zeitschnitte des selektierten Indikators</b>. Standardm&auml;ßig ist der aktuellste Zeitschnitt voreingestellt. " +
                            "<br/>  Durch ein <i>Klicken auf einen beliebigen Punkt der Leiste oder durch Verschieben des runden Auswahlknopfs</i> kann ein <b>anderer Zeitschnitt gew&auml;hlt</b> werden.",
                        onPrev: function (tour) {
                            if ($scope.sidebarLegendClass === "disappear") {
                                $("#sidebarLegendCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#mapUtilButtons",
                        title: "Steuerung der Kartendarstellung",
                        placement: "bottom",
                        content: "Diese Buttons bieten Steuerungsm&ouml;glichkeiten f&uuml;r die Kartendarstellung. &Uuml;ber <i class='fas fa-plus'></i> und <i class='fas fa-minus'></i> kann alternativ zur Verwendung des Mausrades hinein- bzw. hinausgezoomt werden. " +
                            "<br/><br/><span class='glyphicon glyphicon-globe'></span> zentriert die Karte und zoomt auf die maximale Ausdehnung des dargestellten Themas. " +
                            "<br/><br/><span class='glyphicon glyphicon-ban-circle'></span> <b>hebt jegliche benutzerdefinierte Selektionen</b> auf. " +
                            "<br/><br/><i class='fas fa-download'></i> erlaubt den Export des aktuellen <b>Kartenausschnitts als Bilddatei</b>. " +
                            "<br/><br/><i class='fas fa-layer-group'></i> bietet die M&ouml;glichkeit, einzelne Karteninhalte <b>tempor&auml;r auszublenden oder die Hintergrundkarte zu wechseln</b>. " +
                            "<br/><br/><i class='fas fa-filter'></i> erm&ouml;glicht das <b>Filtern innerhalb dargestellter Vektorlayer anhand des Namens oder der ID vorhandener Raumelemente</b>. " +
                            "<br/><br/><span class='glyphicon glyphicon-search'></span> repr&auml;sentiert eine <b>Geolokalisierung von Adressen und Orten</b>. " +
                            "<br/><br/>Dar&uuml;ber hinaus bietet <i class='fas fa-ruler-combined'></i> eine <b>Messfunktion für Abst&auml;nde und Fl&auml;chen</b>."
                    },
                    {
                        element: "#sideBarButtons",
                        title: "Men&uuml;-Buttons",
                        placement: "right",
                        content: "Diese Buttons &ouml;ffnen jeweils ein linksseitig angeordnetets <b>Men&uuml;</b> mitzus&auml;tzlichen Funktionen. Jedes einzelne Men&uuml; wird in den folgenden Schritten kurz erl&auml;utert."
                    },
                    {
                        element: "#sidebarIndicatorConfigCollapse",
                        title: "Indikatorenkatalog und Metadaten",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet das <b>Indikatoren-Auswahl-Fenster</b>. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarIndicatorConfigClass === "disappear") {
                                $("#sidebarIndicatorConfigCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#indicatorSetup",
                        title: "Indikatorenkatalog und Metadaten",
                        placement: "right",
                        content: "Dieses Men&uuml; enth&auml;lt eine <b>&Uuml;bersicht aller verf&uuml;gbarer Indikatoren</b> sowie die Option, " +
                            "den aktuell betrachteten <b>Indikator zu wechseln</b>.<br/><br/> Indikatoren können in Form einer <b>Themenhierarchie</b> im <b>Datenkatalog</b> oder in einer " +
                            "<b>alphabetischen Liste</b> betrachtet und selektiert werden. </br>" +
                            "Einen transparenten Zugang zu zusammenschauenden, bewertenden Indikatoren bietet die <b>Leitindikatoren-Hierarchie</b>.</br>" +
                            "Hiermit können <b>Leitindikatoren</b> sowie die zur Berechnung verwendeten <b>Basis-Indikatoren</b> aufgerufen und deren Verknüpfung nachvollzogen werden. </br>" +
                            "Auch die <b>Metadaten</b> des ausgewählten Indikators können hier detailliert eingesehen werden.",
                        onNext: function (tour) {
                            if ($scope.sidebarIndicatorConfigClass !== "disappear") {
                                $("#sidebarIndicatorConfigCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarIndicatorConfigClass !== "disappear") {
                                $("#sidebarIndicatorConfigCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#sidebarPoiCollapse",
                        title: "Georessourcen und -dienste",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet das <b>Georessourcen</b> Fenster. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarPoiClass === "disappear") {
                                $("#sidebarPoiCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarIndicatorConfigClass === "disappear") {
                                $("#sidebarIndicatorConfigCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#poi",
                        title: "Georessourcen und -dienste",
                        placement: "right",
                        content: "Zur &Uuml;berlagerung von fl&auml;chenhaft dargestellten Indikatoren mit weiteren relevanten Geodaten k&ouml;nnen <b>Punkt- Linien und Flächendaten sowie Geodatendienste</b> " +
                            "zur Karte hinzugef&uuml;gt werden. Hinzuf&uuml;gen und Entfernen dieser Datensätze geschieht dabei durch (De-) Selektion der <i>Auswahlbox</i> links neben dem jeweiligen Datensatz. " +
                            "<br/><br/>In der Standardkonfiguration werden Punktdaten r&auml;umlich zu sogenannten <b>Cluster-Punkten</b> zusammengefasst, um die Darstellung je nach Zoom-Stufe zu optimieren und </br>" +
                            "selbst bei bei vielen Punkten eine übersichtliche Darstellung zu gewährleisten." +
                            "&Uuml;ber eine entsprechende <i>Auswahloption</i> k&ouml;nnen jedoch bei jeder Zoomstufe wahlweise auch <b>alle Einzelpunkte angezeigt</b> werden. " +
                            "<br/><br/><b>Hinweis zum Zeitbezug der darzustellenden Daten:</b><br/>Der Abruf eines Punkt-, Linien- oder Flächendatensatzes bezieht sich immer auf ein Datum. " +
                            "Standardm&auml;&szlig;ig wird der aktuelle Zeitpunkt des dargestellten Indikators verwendet. Diese Option kann jedoch auf ein beliebiges frei definierbares Datum oder eine " +
                            "listenbasierte Auswahl verf&uuml;gbarer Zeitpunkte jedes Datensatzes abge&auml;ndert werden.",
                        onNext: function (tour) {
                            if ($scope.sidebarPoiClass !== "disappear") {
                                $("#sidebarPoiCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarPoiClass !== "disappear") {
                                $("#sidebarPoiCollapse").click();
                            }
                        }
                    },
                    // {
                    // 	element: "#sidebarDataImportCollapse",
                    // 	title: "Datenimport aus externen Quellen",
                    // 	placement: "right",
                    // 	content: "Ein Klick auf diesen Button &ouml;ffnet das Datenimport Fenster. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                    // 	onNext: function(tour){
                    // 		if($scope.sidebarDataImportClass === "disappear"){
                    // 				$("#sidebarDataImportCollapse").click();
                    // 		}
                    // 	}
                    // },
                    // {
                    // 	element: "#dataImport",
                    // 	title: "Datenimport aus externen Quellen",
                    // 	placement: "right",
                    // 	content: "Dieses Fenster bietet Optionen zum <b>Datenimport aus externen Datenquellen</b>, insbesondere mittels <i>Web Map Services</i> und <i>Datei-basierten Quellen wie GeoJSON oder ESRI Shape</i>. <br/><br/>Jeder <b>WMS-Datensatz</b> wird tabellarisch inklusive Titel, Beschreibung, Transparenzschieberegler, URL und Legende dargestellt. Durch Anhaken/Deselektion der Checkbox kann ein Datensatz hinzugef&uuml;gt/entfernt werden. Neben den bereits vorkonfigurierten Datens&auml;tzen lassen sich <i>weitere Quellen &uuml;ber den unten stehenden Button erg&auml;nzen</i>.<br/><br/>Die M&ouml;glichkeit <b>Layer aus einer lokalen Datei einzuladen</b> wird in K&uuml;rze verf&uuml;gbar sein.",
                    // 	onNext: function(tour){
                    // 		if($scope.sidebarDataImportClass !== "disappear"){
                    // 				$("#sidebarDataImportCollapse").click();
                    // 		}
                    // 	},
                    // 	onPrev: function(tour){
                    // 		if($scope.sidebarDataImportClass !== "disappear"){
                    // 				$("#sidebarDataImportCollapse").click();
                    // 		}
                    // 	}
                    // },
                    {
                        element: "#sidebarFilterCollapse",
                        title: "Darstellungsfilter",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur Definition von <b>Darstellungsfiltern</b>. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarFilterClass === "disappear") {
                                $("#sidebarFilterCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarPoiClass === "disappear") {
                                $("#sidebarPoiCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorFilter",
                        title: "Darstellungsfilter",
                        placement: "right",
                        // <br/><br/>Dar&uuml;ber hinaus k&ouml;nnen je nach Fragestellung die Raumebenen-Geometrien (z.B. Stadtteile) auf diejenigen eingeschr&auml;nkt werden, die zur Beantwortung der Fragestellung beitragen.
                        content: "Hier k&ouml;nnen verschiedene <b>Darstellungsfilter</b> angewendet werden, die sich auf die <i>kartografische Darstellung</i> auswirken. " +
                            "&Uuml;ber den <b>Wertebereichsfilter</b> k&ouml;nnen die angezeigten Raumeinheiten anhand der Wertauspr&auml;gung des angezeigten Indikators gefiltert werden. " +
                            "Dazu kann der Schieberegler an dem minimalen und maximalen Werten nach rechts oder links geschoben werden. Alternativ kann die <b>untere und/oder obere Grenze</b> " +
                            "auch als Zahlenwert eingetragen werden. </br>" +
                            "</br>Eine weitere Option ist die <b>dynamische Schwellenwertklassifizierung</b>, bei der ein spezifischer <b>Wert</b> definiert werden kann, " +
                            "der die Indikator-Darstellung in <b>zwei Bereiche</b> unterteilt (oberhalb und unterhalb des Schwellenwerts) und entsprechend farbig darstellt.",
                        onNext: function (tour) {
                            if ($scope.sidebarFilterClass !== "disappear") {
                                $("#sidebarFilterCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarFilterClass !== "disappear") {
                                $("#sidebarFilterCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#sidebarBalanceCollapse",
                        title: "Zeitliche Bilanzierung",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur <b>zeitlichen Bilanzierung</b> des aktuell dargestellten Indikators. " +
                            "<br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarBalanceClass === "disappear") {
                                $("#sidebarBalanceCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarFilterClass === "disappear") {
                                $("#sidebarFilterCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorBalance",
                        title: "Zeitliche Bilanzierung",
                        placement: "right",
                        content: "Bei der zeitlichen Bilanzierung steht die <b>Wertentwicklung eines Indikators</b> &uuml;ber die Zeit im Fokus (z. B. Wachstum / Schrumpfung). " +
                            "Wird die Bilanzierung anhand der <b>Auswahlbox</b> aktiviert, kann &uuml;ber die Zeitleiste ein Start- sowie ein Endzeitpunkt festgelegt werden. </br>" +
                            "Für diesen spezifizifischen <b>Betrachtungszeitraum</b> wird dann automatisch die Wertentwicklung des angezeigten Indikators berechnet und dargestellt. " +
                            "<br/><br/>Auch die Indikatoren-Legende am rechten Rand der Anwendung beinhaltet dann die Information, dass eine Bilanz des Indikators dargestellt wird. " +
                            "<br/><br/>Der Trendverlauf im Betrachtungszeitraumwird zudem in Form eines Liniendiagrammes visualisiert. " +
                            "<br>Zur Trendberechnung kann in KomMonitor zwischen einer linearen, exponentiellen und polynomialen Herleitung gewählt werden. " +
                            "<br>Des Weiteren sind statistische Merkmale der gewählten Trendbetrachtung hinterlegt. Hierzu zählen beispielsweise Standardabweichung, Varianz, Mittelwert und Median sowie " +
                            "die Art des Trendverlaufes. " +
                            "<br/><br/><b>Bitte beachten Sie, dass eine Bilanzierung nur bei Status-Indikatoren m&ouml;glich ist, " +
                            "deren Zeitreihe mehr als einen Zeitpunkt enth&auml;lt.</b>",
                        onNext: function (tour) {
                            if ($scope.sidebarBalanceClass !== "disappear") {
                                $("#sidebarBalanceCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarBalanceClass !== "disappear") {
                                $("#sidebarBalanceCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#sidebarDiagramsCollapse",
                        title: "Statistische Diagramme",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster mit <b>statistischen Diagrammen</b>. " +
                            "<br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarDiagramsClass === "disappear") {
                                $("#sidebarDiagramsCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarBalanceClass === "disappear") {
                                $("#sidebarBalanceCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#indicatorDiagrams",
                        title: "Statistische Diagramme",
                        placement: "right",
                        content: "Zus&auml;tzlich zur kartografischen Darstellung bieten grundlegende <b>statistische Diagramme</b> hilfreiche Zusatzinformationen zum gew&auml;hlten Indikator. " +
                            "<br/><br/>Ein <b>Ranking</b> der jeweiligen Raumeinheiten wird anhand eines <b>S&auml;ulendiagramms</b> dargestellt. " +
                            "<br/><br/>Das untere <b>Liniendiagramm</b> visualisiert die <b>zeitliche Entwicklung</b> des aktuellen Indikators &uuml;ber alle jeweils verf&uuml;gbaren Zeitschnitte. " +
                            "Als Zusatzinformation wird hier der Durchschnittswert &uuml;ber alle Raumeinheiten dargestellt. " +
                            "<br/><br/>Um einzelne Elemente der gew&auml;hlten Raumebene im S&auml;ulen- und Liniendiagramm zu betrachten und <i>hervorzuheben</i>, " +
                            "kann mit dem <i>Mauszeiger</i> entweder &uuml;ber die <i>S&auml;ule innerhalb des S&auml;ulendiagramms</i> oder &uuml;ber das jeweilige <i>Element in der Karte</i> gefahren werden. " +
                            "Eine dauerhafte Selektion durch Klicken auf das kartografische Element oder die dazugeh&ouml;rige S&auml;ule erm&ouml;glicht das simultane Betrachten mehrerer Elemente. " +
                            "<br/><br/>Jedes Diagramm enth&auml;lt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
                        onNext: function (tour) {
                            if ($scope.sidebarDiagramsClass !== "disappear") {
                                $("#sidebarDiagramsCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarDiagramsClass !== "disappear") {
                                $("#sidebarDiagramsCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#sidebarRadarDiagramCollapse",
                        title: "Indikatorenradar",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet das <b>Indiktorenradar</b> f&uuml;r die Querschnittsbetrachtung mehrerer Indikatoren. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarRadarDiagramClass === "disappear") {
                                $("#sidebarRadarDiagramCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarDiagramsClass === "disappear") {
                                $("#sidebarDiagramsCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#indicatorRadar",
                        title: "Indikatorenradar",
                        placement: "right",
                        content: "Das <b>Indikatorenradar</b> eignet sich insbesondere f&uuml;r die <b>querschnittsorientierte Betrachtung mehrerer Indikatoren</b>. " +
                            "<br/>F&uuml;r die Anzeige eines solchen Diagramms, <i>selektieren Sie bitte mindestens drei Indikatoren</i> aus der oben stehenden Liste. <br/><br/>" +
                            "F&uuml;r jeden gew&auml;hlten Indikator wird im Diagramm eine Achse genutzt, auf der einzelne Raumeinheiten anhand ihrer Wertauspr&auml;gung abgetragen werden. " +
                            "Jede Achse wird dabei durch <b>Minimum und Maximum</b> der Werte des betrachteten Indikators gebildet (daher ist die <b><i>Radarmitte ausdr&uuml;cklich nicht zwingend " +
                            "mit dem Wert '0' gleichzusetzen, sondern mit dem Minimalwert des Indikators</i></b>). <br/><br/>Auch hier ist der Durchschnitt aller Raumeinheiten bereits vorberechnet und " +
                            "einzelne Elemente k&ouml;nnen mittels Selektion innerhalb der Karte dem Radar hinzugef&uuml;gt werden. Die Indikatorenauswahl umfasst dabei nur solche Indikatoren, " +
                            "die die gew&auml;hlte Raumebene und den aktuell gew&auml;hlten Zeitschnitt unterst&uuml;tzen.<br/><br/> Auch das Radardiagramm besitzt in der oberen rechte Ecke eine " +
                            "<b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann",
                        onNext: function (tour) {
                            if ($scope.sidebarRadarDiagramClass !== "disappear") {
                                $("#sidebarRadarDiagramCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarRadarDiagramClass !== "disappear") {
                                $("#sidebarRadarDiagramCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#sidebarRegressionDiagramCollapse",
                        title: "Regressionsdiagramm",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet das Fenster zur Definition von <b>Regressionsdiagrammen</b>. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarRegressionDiagramClass === "disappear") {
                                $("#sidebarRegressionDiagramCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarRadarDiagramClass === "disappear") {
                                $("#sidebarRadarDiagramCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#indicatorRegression",
                        title: "Regressionsdiagramm",
                        placement: "right",
                        content: "Als exemplarischer weiterer Diagrammtyp unterst&uuml;tzt KomMonitor die Berechnung einer <b>linearen Regression</b> zwischen zwei zu w&auml;hlenden Indikatoren, um insbesondere die <b>Korrelation</b> zwischen diesen zu betrachten. Nach Auswahl der Indikatoren werden die Regressionsgerade und alle Elemente der gew&auml;hlten Raumebene gem&auml;ß ihrer Wertauspr&auml;gungen entlang der Indikatorenachsen im Diagramm abgetragen. <br/><br/>Beim &Uuml;berfahren eines Datenpunkts mit der Maus im Diagramm oder einer in der Karte dargestellten Raumeinheit, wird das jeweilige Pendant visuell hervorgehoben.<br/><br/>Die Indikatorenauswahl umfasst dabei nur solche Indikatoren, die die gew&auml;hlte Raumebene und den aktuell gew&auml;hlten Zeitschnitt unterst&uuml;tzen.<br/><br/> Auch das Regressionsdiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
                        onNext: function (tour) {
                            if ($scope.sidebarRegressionDiagramClass !== "disappear") {
                                $("#sidebarRegressionDiagramCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarRegressionDiagramClass !== "disappear") {
                                $("#sidebarRegressionDiagramCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#sidebarReachabilityCollapse",
                        title: "Erreichbarkeitsanalysen",
                        placement: "right",
                        content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster f&uuml;r <b>Erreichbarkeitsanalysen</b>. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                        onNext: function (tour) {
                            if ($scope.sidebarReachabilityClass === "disappear") {
                                $("#sidebarReachabilityCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarRegressionDiagramClass === "disappear") {
                                $("#sidebarRegressionDiagramCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#kommonitorReachability",
                        title: "Erreichbarkeitsanalysen",
                        placement: "right",
                        content: "Als GIS-basiertes Werkzeug soll KomMonitor ausgew&auml;hlte <b>r&auml;umliche Analysen</b> unterst&uuml;tzen. " +
                            "Insbesondere stehen <b>Erreichbarkeitsanalysen</b> im Fokus, bei denen, neben reinen <i>Puffer-basierten Ans&auml;tzen</i>, " +
                            "<b>Erreichbarkeiten anhand tats&auml;chlicher Wegenetze</b> f&uuml;r verschiedene <b>Transportmittel (z.B. Fußg&auml;nger, Fahrrad, Auto)</b> " +
                            "berechnet werden k&ouml;nnen. Konkret soll hierbei sowohl ein <b>Routing</b> zwischen einzelnen Punkten sowie " +
                            "die Berechnung von <b>Isochronen (&Auml;quidistanzen und zeitliches Abbruchkriterium)</b> angeboten werden.<br/><br/> " +
                            "<b>Auswahl der Startpunkte</b><br/> " +
                            "Die Auswahl der Startpunkte kann entweder &uuml;ber die Selektion eines vorhandenen Punktdatensatzes vorgenommen werden oder mittels Einzeichnen eigener beliebiger Punkte in die Karte.<br/><br/> " +
                            "<b>Ergebnisdarstellung</b><br/> " +
                            "Sowohl Isochronen- als auch Routingergebnisse werden der Karte als neuer, eigener Layer hinzugef&uuml;gt. " +
                            "Die jeweilige Legende über jeweiligen Reiter des rechten Legendenmenüs einsehbar.<br/><br/> " +
                            "<b>Punkt in Isochronen Analyse</b><br/> " +
                            "Nachdem eine Isochronenberechnung erfolgt ist, können vorhandene Punktdatensätze r&auml;umlich mit den Isochronen verschnitten werden, bspw. um eine Umfeldanalyse für relevante Einrichtungen durchzuf&uuml;hren.",
                        onNext: function (tour) {
                            if ($scope.sidebarReachabilityClass !== "disappear") {
                                $("#sidebarReachabilityCollapse").click();
                            }
                        },
                        onPrev: function (tour) {
                            if ($scope.sidebarReachabilityClass !== "disappear") {
                                $("#sidebarReachabilityCollapse").click();
                            }
                        }
                    },
                    {
                        element: "#map",
                        title: "Vielen Dank für die Nutzung der Guided Tour von KomMonitor!",
                        placement: "left",
                        content: "<b>Wir hoffen, die Erläuterungen konnten einen guten Einblick in die Funktionen bieten, " +
                            "bei der ersten Orientierung helfen und die zukünftige Nutzung erleichtern!</br></br> " +
                            "Kritik, Anregungen oder Fragen sind jederzeit willkommen.</b> <i>(siehe Begrüßungsfenster für den Kontakt).</br></br> " +
                            "<b>Viel Spaß bei der Nutzung von KomMonitor! </b>",
                        onNext: function (tour) {
                            kommonitorDataExchangeService.guidedTour = undefined; // ends the tour				
                        }
                    }
                    // {
                    // 	element: "#sidebarProcessingCollapse",
                    // 	title: "Individuelle Indikatoren-Neuberechnung",
                    // 	placement: "right",
                    // 	content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur <b>individuellen Neuberechnung einzelner Indikatoren</b>. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
                    // 	onNext: function(tour){
                    // 		if($scope.sidebarProcessingClass === "disappear"){
                    // 				$("#sidebarProcessingCollapse").click();
                    // 		}
                    // 	},
                    // 	onPrev: function(tour){
                    // 		if($scope.sidebarReachabilityClass === "disappear"){
                    // 				$("#sidebarReachabilityCollapse").click();
                    // 		}
                    // 	}
                    // },
                    // {
                    // 	element: "#indicatorProcessing",
                    // 	title: "Individuelle Indikatoren-Neuberechnung",
                    // 	placement: "right",
                    // 	content: "KomMonitor ist mehr als nur ein Darstellungswerkzeug. Es erm&ouml;glicht insbesondere auch die <b>automatisierte Berechnung von Indikatoren</b>. Je nach Berechnungsvorschrift kann es dabei <b>konfigurierbare Parameter</b> geben, die die <i>resultierenden Indikatorenwerte beeinflussen</i> (bspw. eine maximle Distanz bei Erreichbarkeiten oder Gewichtungen grundlegender Eingangsdaten). <br/><br/>Dieses Men&uuml; bietet die M&ouml;glichkeit einer <b>Nutzer-definierten Neuberechnung von Indikatoren</b> mit mindestens einem konfigurierbaren Parameter. Das jeweilige Berechnungsergebnis steht anschlie&szlig;end tempor&auml;r zur Verf&uuml;gung und kann bei Bedarf exportiert werden. <br/><br/>K&uuml;nftig sollen dar&uuml;ber hinaus unmittelbare Vergleiche mit der 'Standard'-Variante des Indikators angeboten werden. Diese sind jedoch zum gegenw&auml;rtigen Zeitpunkt noch nicht in der Anwendung umgesetzt.",
                    // 	onNext: function(tour){
                    // 		if($scope.sidebarProcessingClass !== "disappear"){
                    // 				$("#sidebarProcessingCollapse").click();
                    // 		}
                    // 	},
                    // 	onPrev: function(tour){
                    // 		if($scope.sidebarProcessingClass !== "disappear"){
                    // 				$("#sidebarProcessingCollapse").click();
                    // 		}
                    // 	}
                    // }
                ],
                onShown: function (tour) {
                    // add shortcut to toc to each title
                    let titleElement = document.getElementsByClassName("popover-title").item(0);
                    titleElement.innerHTML +=
                        "<span data-toggle='tooltip' title='zum Inhaltsverzeichnis'>" +
                            "<i class='fas fa-book' ng-click='goToGuidedTourStep($ctrl.kommonitorDataExchangeServiceInstance.guidedTour, 1)'></i></span>";
                    $compile(titleElement)($scope); // let angularjs know that there is new html, add the ng-click event
                }
            };
            $scope.generateTableOfContent = function () {
                let prevStepTitle = undefined;
                for (var i = 0; i < $scope.tourOptions.steps.length; i++) {
                    let step = $scope.tourOptions.steps[i];
                    // only show the first guided tour step for each subtheme
                    // specifically exclude "Individuelle Indikatoren-Neuberechnung" for now as it is not shown in the guided tour
                    if (step.title !== prevStepTitle && step.title !== "Individuelle Indikatoren-Neuberechnung") {
                        let html = "<li class='guided-tour-toc-element' ng-click='goToGuidedTourStep($ctrl.kommonitorDataExchangeServiceInstance.guidedTour, " + i + ")'>" + step.title + "</li>";
                        let compiled = $compile(html)($scope); // let angularjs know that there is new html, add the ng-click event
                        angular.element(document.getElementById('guided-tour-toc')).append(compiled);
                    }
                    prevStepTitle = step.title;
                }
            };
            $scope.goToGuidedTourStep = function (tour, targetStepIndex) {
                // The method "goTo" provided by the library jumps directly to the target step, ignoring the "onNext" and "onPrev" methods.
                // That leads to menues not being opened/closed. To fix this we iterate the steps manually.
                while (tour.getCurrentStep() < targetStepIndex)
                    tour.next();
                while (tour.getCurrentStep() > targetStepIndex)
                    tour.prev();
            };
            $scope.startGuidedTour = function () {
                // GUIDED TOUR
                // Instance the tour
                kommonitorDataExchangeService.guidedTour = new Tour($scope.tourOptions);
                // Initialize the tour
                kommonitorDataExchangeService.guidedTour.init();
                // Start the tour
                try {
                    kommonitorDataExchangeService.guidedTour.restart();
                }
                catch (error) {
                    kommonitorDataExchangeService.guidedTour.start(true);
                }
                // tour gotTo() example to jump to step 7 --> index starts from 0
                // kommonitorDataExchangeService.guidedTour.goTo(6);
            };
            $scope.$on("redrawGuidedTourElement", async function (event) {
                await sleep(100);
                if (kommonitorDataExchangeService.guidedTour) {
                    kommonitorDataExchangeService.guidedTour.redraw();
                }
            });
            $scope.init();
        }
    ]
});
//# sourceMappingURL=kommonitor-user-interface.component.js.map