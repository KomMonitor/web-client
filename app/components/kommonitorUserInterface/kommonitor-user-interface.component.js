angular.module('kommonitorUserInterface').component('kommonitorUserInterface', {
	templateUrl : "components/kommonitorUserInterface/kommonitor-user-interface.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', function UserInterfaceController(kommonitorDataExchangeService, $scope, $rootScope) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		kommonitorDataExchangeService.anySideBarIsShown = false;
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

		$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
		$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
		$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonProcessingClass = "btn btn-custom btn-circle";
		$scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonFilterClass = "btn btn-custom btn-circle";
		$scope.buttonBalanceClass = "btn btn-custom btn-circle";
		$scope.buttonReachabilityClass = "btn btn-custom btn-circle";
		$scope.buttonPoiClass = "btn btn-custom btn-circle";

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		$scope.undockButtons = function(){
			$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
			$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
			$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
			$scope.buttonProcessingClass = "btn btn-custom btn-circle";
			$scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
			$scope.buttonFilterClass = "btn btn-custom btn-circle";
			$scope.buttonBalanceClass = "btn btn-custom btn-circle";
			$scope.buttonReachabilityClass = "btn btn-custom btn-circle";
			$scope.buttonPoiClass = "btn btn-custom btn-circle";

			// in addition check if balance menue and button are allowed for current indicator
			// it is not allowed if indicator is of type "DYNAMIC"
			$scope.checkBalanceButtonAndMenueState();
		};

		$scope.hideSidebars = function(){
			$scope.sidebarIndicatorConfigClass = "disappear";
			$scope.sidebarDiagramsClass = "disappear";
			$scope.sidebarRadarDiagramClass = "disappear";
			$scope.sidebarProcessingClass = "disappear";
			$scope.sidebarRegressionDiagramClass = "disappear";
			$scope.sidebarFilterClass = "disappear";
			$scope.sidebarBalanceClass = "disappear";
			$scope.sidebarReachabilityClass = "disappear";
			$scope.sidebarPoiClass = "disappear";
		};

		$scope.checkBalanceButtonAndMenueState = function(){
			// disable if indicator is dynamic or if indicator only contains 1 or less timeseries entries
			if(kommonitorDataExchangeService.selectedIndicator.indicatorType === "DYNAMIC" || kommonitorDataExchangeService.selectedIndicator.applicableDates.length < 2){
				$scope.buttonBalanceClass = "btn btn-custom btn-circle disabled";
				$scope.sidebarBalanceClass = "disappear";
			}
			else{
				$scope.buttonBalanceClass = "btn btn-custom btn-circle";
			}
		};

		$scope.$on("checkBalanceMenueAndButton", function(event){
			$scope.checkBalanceButtonAndMenueState();
		});

		$scope.onSidebarIndicatorButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarIndicatorConfigClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarIndicatorConfigClass = "";
				$scope.buttonIndicatorConfigClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarIndicatorConfigClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");

		}

		$scope.onSidebarPoiButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarPoiClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarPoiClass = "";
				$scope.buttonPoiClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarPoiClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");

		}

		$scope.onSidebarFilterButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarFilterClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarFilterClass = "";
				$scope.buttonFilterClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarFilterClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");

		}

		$scope.onSidebarBalanceButtonClick = function(){

			// check if button is marked as disabled
			if($scope.buttonBalanceClass.includes("disabled")){
				// do nothing
				return;
			}
			else{
				$scope.undockButtons();

				if($scope.sidebarBalanceClass === "disappear"){
					$scope.hideSidebars();
					$scope.sidebarBalanceClass = "";
					$scope.buttonBalanceClass = "btn btn-custom-docked btn-docked";

					if(kommonitorDataExchangeService.anySideBarIsShown === false){
						$rootScope.$broadcast("recenterMapOnShowSideBar");
					}
					kommonitorDataExchangeService.anySideBarIsShown = true;
				}
				else{
					$scope.sidebarBalanceClass = "disappear";
					$rootScope.$broadcast("recenterMapOnHideSideBar");
					kommonitorDataExchangeService.anySideBarIsShown = false;
				}

				$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
				$rootScope.$broadcast("redrawGuidedTourElement");
			}
		}

		$scope.onSidebarReachabilityButtonClick = function(){
			$scope.undockButtons();

			if($scope.sidebarReachabilityClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarReachabilityClass = "";
				$scope.buttonReachabilityClass = "btn btn-custom-docked btn-docked";

				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarReachabilityClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");

		}

		$scope.onSidebarDiagramsClick = function(){
			$scope.undockButtons();
			if($scope.sidebarDiagramsClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarDiagramsClass = "";
				$scope.buttonDiagramsClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarDiagramsClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");
		}

		$scope.onSidebarRadarDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRadarDiagramClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarRadarDiagramClass = "";
				$scope.buttonRadarDiagramClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarRadarDiagramClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");
		}

		$scope.onSidebarProcessingClick = function(){
			$scope.undockButtons();
			if($scope.sidebarProcessingClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarProcessingClass = "";
				$scope.buttonProcessingClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarProcessingClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");
		}

		$scope.onSidebarRegressionDiagramClick = function(){
			$scope.undockButtons();
			if($scope.sidebarRegressionDiagramClass === "disappear"){
				$scope.hideSidebars();
				$scope.sidebarRegressionDiagramClass = "";
				$scope.buttonRegressionDiagramClass = "btn btn-custom-docked btn-docked";
				if(kommonitorDataExchangeService.anySideBarIsShown === false){
					$rootScope.$broadcast("recenterMapOnShowSideBar");
				}
				kommonitorDataExchangeService.anySideBarIsShown = true;
			}
			else{
				$scope.sidebarRegressionDiagramClass = "disappear";
				$rootScope.$broadcast("recenterMapOnHideSideBar");
				kommonitorDataExchangeService.anySideBarIsShown = false;
			}

			$rootScope.$broadcast("refreshIndicatorValueRangeSlider");
			$rootScope.$broadcast("redrawGuidedTourElement");
		}

		$scope.onRecenterMapButtonClick = function(){
			$rootScope.$broadcast("recenterMapContent");
		}

		$scope.onUnselectFeaturesButtonClick = function(){
			$rootScope.$broadcast("unselectAllFeatures");
		}

		$scope.onToggleInfoControlButtonClick = function(){
			$rootScope.$broadcast("toggleInfoControl");
		}

		$scope.onToggleLegendControlButtonClick = function(){
			$rootScope.$broadcast("toggleLegendControl");
		}

		$scope.$on("startGuidedTour", function(event){
				$scope.startGuidedTour();
		});

		$scope.tourOptions = {
			container: "body",
			backdrop: true,
			backdropContainer: "body",
			smartPlacement: false,
			onEnd: function(tour){
				kommonitorDataExchangeService.guidedTour = undefined;
			},
			template: "<div class='popover tour'> <div class='arrow'></div> <h3 class='popover-title'></h3>  <div class='popover-content'></div><div class='popover-navigation'> <div class='btn-group'> <button class='btn btn-sm btn-default' data-role='prev'>« Zur&uuml;ck</button> <button class='btn btn-sm btn-default' data-role='next'>Weiter »</button> </div> <button class='btn btn-sm btn-default' data-role='end'>Guided Tour beenden</button></div></div>",
			steps: [
			{
				element: "#header",
				title: "Kopfzeile",
				placement: "bottom",
				content: "In der Kopfzeile befinden sich neben dem Titel der Webanwendung ein <b>Info-Button</b>, der das beim Aufruf der Seite erschienene Informationsfenster &ouml;ffnet, ein <b>Feeback-Button</b>, sowie Button zum (erneuten) <b>Starten der gef&uuml;hrten Tour</b>."
			},
			{
				element: "#map",
				title: "Kartenfenster",
				placement: "top",
				content: "Beim Anwendungsstart sehen Sie zun&auml;chst die <b>kartographische Darstellung</b> eines ausgew&auml;hlten Indikators. In dieser Darstellung k&ouml;nnen Sie in der <b>Karte frei navigieren (zoomen, verschieben)</b> und beim <i>Her&uuml;berfahren mit dem Mauszeiger &uuml;ber eines der Indikator-Geometrien</i> erhalten sie ein <b>Popup mit dem Indikator-Wert</b>.",
				onNext: function(tour){
					// make sure that Info control is displayed

					var control = document.getElementById("infoControl");
					var controlButton = document.getElementById("toggleInfoControlButton");
					if(control.style.display === "none" || (controlButton.style.display !== undefined && controlButton.style.display !== "none")){
						$rootScope.$broadcast("toggleInfoControl");
					}

				},
			},
			{
				element: "#infoControl",
				title: "Indikatoren-Informationsfenster",
				placement: "left",
				content: "Dieses Element enth&auml;lt die wichtigsten <b>Metadaten</b> &uuml;ber den aktuell dargestellten Indikator. Dar&uuml;ber hinaus kann hier die <b>Raumbezugsebene gewechselt</b> werden (in Abh&auml;ngigkeit der verf&uuml;gbaren Raumebenen des gew&auml;hlten Indikators). <br/><br/>Die <b>Checkbox</b> unten steuert, ob der <b>Indikator-Layer halbtransparent</b> &uuml;ber der Hintergrundkarte dargestellt werden soll.",
				onNext: function(tour){
					// make sure that legend control is displayed

					var control = document.getElementById("legendControl");
					var controlButton = document.getElementById("toggleLegendControlButton");
					if(control.style.display === "none" || (controlButton.style.display !== undefined && controlButton.style.display !== "none")){
						$rootScope.$broadcast("toggleLegendControl");
					}

				}
			},
			{
				element: "#legendControl",
				title: "Indikatorenlegende",
				placement: "left",
				content: "Dieses Element repr&auml;sentiert die <b>Legende</b>, sprich die Zuordnung von Indikatorenwertebereichen zu Darstellungsfarben. &Uuml;ber die <b>Radio-Buttons</b> (Jenks, Gleiches Intervall, Quantile) kann die <b>Klassifizierungsmethode</b> ge&auml;ndert werden (f&uuml;r detaillierte Informationen zu den Klassifizierungsmethoden lesen Sie bitte das <b>Popup</b>, das erscheint, wenn Sie mit dem <i>Mauszeiger &uuml;ber eine der drei Optionen fahren</i>). <br/><br/> KomMonitor &uuml;berpr&uuml;ft jeden Indikatorendatensatz auf <b>Ausrei&szlig;er</b>. Werden ein oder mehrere Ausrei&szlig;er erkannt, so enth&auml;t die Legende auch eine <b>Checkbox</b>, mit der <i>Ausrei&szlig;er gesondert markiert und aus der Klassifizierung genommen werden k&ouml;nnen</i>. ",
				onPrev: function(tour){
					// make sure that legend control is displayed

					var control = document.getElementById("infoControl");
					var controlButton = document.getElementById("toggleInfoControlButton");
					if(control.style.display === "none" || (controlButton.style.display !== undefined && controlButton.style.display !== "none")){
						$rootScope.$broadcast("toggleInfoControl");
					}

				},
			},
			{
				element: "#dateSliderWrapper",
				title: "Zeitstrahl",
				placement: "top",
				content: "Die <b>Zeitleiste</b> am unteren Bildschirmrand enth&auml;lt die <b>verf&uuml;gbaren Zeitschnitte des selektierten Indikators</b>. Standardm&auml;ßig ist der aktuellste Zeitschnitt voreingestellt. Durch ein <i>Klicken auf einen beliebigen Punkt der Leiste oder durch Verschieben des runden Auswahlknopfs</i> k&ouml;nnen Sie den <b>Zeitschnitt &auml;ndern</b>.",
				onPrev: function(tour){
					// make sure that legend control is displayed

					var control = document.getElementById("legendControl");
					var controlButton = document.getElementById("toggleLegendControlButton");
					if(control.style.display === "none" || (controlButton.style.display !== undefined && controlButton.style.display !== "none")){
						$rootScope.$broadcast("toggleLegendControl");
					}

				},
			},
			{
				element: "#mapUtilButtons",
				title: "Steuerung der Kartendarstellung",
				placement: "bottom",
				content: "Diese Buttons bieten Steuerungsm&ouml;glichkeiten f&uuml;r die Kartendarstellung. &Uuml;ber <b>Plus</b> und <b>Minus</b> kann alternativ zur Verwendung des Mausrades hinein- bzw. hinausgezoomt werden. <br/><br/>Der <b>Weltkugel-Button</b> zentriert die Karte und zoomt auf die maximale Ausdehnung des dargestellten Themas. <br/><br/>Der mittlere Button <b>hebt jegliche benutzerdefinierte Selektionen</b> auf. <br/><br/>Der rechte <b>Layer-Button</b> bietet die M&ouml;glichkeit, einzelne Layer <b>tempor&auml;r auszublenden oder die Hintergrundkarte zu wechseln</b>."
			},
			{
				element: "#sideBarButtons",
				title: "Men&uuml;-Buttons",
				placement: "right",
				content: "Diese Buttons &ouml;ffnen jeweils ein linkseitig angeordnetets <b>Men&uuml;</b>, um zus&auml;tzliche Funktionen auszuf&uuml;hren. Jedes einzelne Men&uuml; wird in den folgenden Schritten kurz erl&auml;utert."
			},
			{
				element: "#sidebarIndicatorConfigCollapse",
				title: "Indikatorenkatalog und Verkn&uuml;pfungen zu anderen Indikatoren oder Geodaten",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet das Indikatoren-Auswahl-Fenster. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarIndicatorConfigClass === "disappear"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				},
			},
			{
				element: "#indicatorSetup",
				title: "Indikatorenkatalog und Verkn&uuml;pfungen zu anderen Indikatoren oder Geodaten",
				placement: "right",
				content: "Dieses Men&uuml; enth&auml;lt eine <b>&Uuml;bersicht aller verf&uuml;gbarer Indikatoren</b> sowie die Optionen, den aktuell betrachteten <b>Indikator zu wechseln</b> oder den Indikator in der gew&auml;hlten Raumebene zu <b>exportieren</b> (derzeitg nur eingeschr&auml;nkte Exportoptionen). <br/><br/>Im obigen <b>Themenfilter</b> kann die &Uuml;bersicht der Indikatoren nach verschiedenen Themenkomplexen gefiltert werden. <br/><br/>Sollte ein Indikator etwaige <b>Verkn&uuml;pfungen</b> zu anderen Indikatoren oder sonstigen Geodaten beinhalten, so werden diese in tabellarischer Form kenntlich gemacht.",
				onNext: function(tour){
					if($scope.sidebarIndicatorConfigClass !== "disappear"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarIndicatorConfigClass !== "disappear"){
							$("#sidebarIndicatorConfigCollapse").click();
					}
				}
			},
			{
				element: "#sidebarPoiCollapse",
				title: "Points of Interest",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet das Points of Interest Fenster. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarPoiClass === "disappear"){
							$("#sidebarPoiCollapse").click();
					}
				}
			},
			{
				element: "#poi",
				title: "Points of Interest",
				placement: "right",
				content: "Zur &Uuml;berlagerung von fl&auml;chenhaften Indikator-Geometrien mit weiteren relevanten Geodaten k&ouml;nnen hier sogenannte <b>Points of Interest (POI)-Layer</b> zur Karte hinzugef&uuml;gt werden. Hinzuf&uuml;gen und Entfernen der POI-Layer geschieht dabei durch (De-) Selektion der jeweiligen <i>Checkbox</i>. <br/><br/>In der Standardkonfiguration werden die einzelnen Punktgeometrien r&auml;umlich zu sogenannten <b>Cluster-Punkten</b> zusammengefasst, um die Darstellung je nach Zoom-Stufe zu optimieren. &Uuml;ber eine entsprechende <i>Auswahloption</i> k&ouml;nnen jedoch bei jeder Zoomstufe wahlweise auch <b>alle Einzelpunkte dargestellt</b> werden.",
				onNext: function(tour){
					if($scope.sidebarPoiClass !== "disappear"){
							$("#sidebarPoiCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarPoiClass !== "disappear"){
							$("#sidebarPoiCollapse").click();
					}
				}
			},
			{
				element: "#sidebarFilterCollapse",
				title: "Darstellungsfilter",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur Definition von Darstellungsfiltern. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarFilterClass === "disappear"){
							$("#sidebarFilterCollapse").click();
					}
				}
			},
			{
				element: "#kommonitorFilter",
				title: "Darstellungsfilter",
				placement: "right",
				// <br/><br/>Dar&uuml;ber hinaus k&ouml;nnen je nach Fragestellung die Raumebenen-Geometrien (z.B. Stadtteile) auf diejenigen eingeschr&auml;nkt werden, die zur Beantwortung der Fragestellung beitragen.
				content: "Hier k&ouml;nnen verschiedene <b>Darstellungsfilter</b> angewendet werden, die sich auf die <i>kartographische Darstellung</i> auswirken. &Uuml;ber den <b>Wertebereichsfilter</b> k&ouml;nnen die angezeigten Raumeinheiten anhand ihrer Wertauspr&auml;gung gefiltert werden. Dazu kann der Schieberegler an dem minimalen und maximalen Werten nach rechts/links geschoben werden.<br/><br/>Eine weitere Option ist die <b>dynamische Schwellwertklassifizierung</b>, bei der ein spezifischer <b>Wert</b> definiert werden kann, der die Indikator-Darstellung in <b>zwei Bereiche</b> unterteilt (oberhalb und unterhalb des Schwellwerts) und entsprechend farbig darstellt.",
				onNext: function(tour){
					if($scope.sidebarFilterClass !== "disappear"){
							$("#sidebarFilterCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarFilterClass !== "disappear"){
							$("#sidebarFilterCollapse").click();
					}
				}
			},
			{
				element: "#sidebarBalanceCollapse",
				title: "Zeitliche Bilanzierung",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur zeitlichen Bilanzierung des aktuell dargestellten Indikators. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarBalanceClass === "disappear"){
							$("#sidebarBalanceCollapse").click();
					}
				}
			},
			{
				element: "#kommonitorBalance",
				title: "Zeitliche Bilanzierung",
				placement: "right",
				content: "Bei der zeitlichen Bilanzierung steht die <b>Wertentwicklung eines Indikators</b> &uuml;ber die Zeit im Fokus (z. B. Wachstum / Schrumpfung). Wird die Bilanzierung mittels der entsprehenden <b>Checkbox</b> aktiviert, so kann &uuml;ber die Zeitleiste ein <b>Zeitraum</b> spezifiziert werden, f&uuml;r den die Wertentwicklung berechnet und dargestellt werden soll. <br/><br/>Die Indikatoren-Legende am unteren rechten Rand der Anwendung zeigt &uuml;ber dies bei aktivierter Checkbox an, dass die Bilanz des Indikators dargestellt wird.<br/><br/>Bitte bachten Sie, dass eine Bilanzierung nur bei Status-Indikatoren m&ouml;glich ist, deren Zeitreihe mehr als einen Eintrag enth&auml;lt.",
				onNext: function(tour){
					if($scope.sidebarBalanceClass !== "disappear"){
							$("#sidebarBalanceCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarBalanceClass !== "disappear"){
							$("#sidebarBalanceCollapse").click();
					}
				}
			},
			{
				element: "#sidebarDiagramsCollapse",
				title: "Statistische Diagramme",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster mit statistischen Diagrammen. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarDiagramsClass === "disappear"){
							$("#sidebarDiagramsCollapse").click();
					}
				}
			},
			{
				element: "#indicatorDiagrams",
				title: "Statistische Diagramme",
				placement: "right",
				content: "Zus&auml;tzlich zur kartographischen Darstellung bieten grundlegende <b>statistische Diagramme</b> hilfreiche Zusatzinformationen zum gew&auml;hlten Indikator. <br/><br/> Das obige <b>Histogramm</b> fokussiert die <b>Werteverteilung</b> und zeigt an, wie viele Elemente der Raumebene in welchem Klassenintervall liegen. <br/><br/>Ein <b>Ranking</b> der jeweiligen Raumeinheiten wird &uuml;ber das mittlere <b>S&auml;ulendiagramm</b> dargestellt.<br/><br/>Das untere <b>Liniendiagramm</b> visualisiert die <b>zeitliche Entwicklung</b> des aktuellen Indikators &uuml;ber alle jeweils verf&uuml;gbaren Zeitschnitte. Standardm&auml;&szlig;ig wird hier der Durchschnittswert &uuml;ber alle Raumeinheiten dargestellt.<br/><br/>Um einzelne Elemente der gew&auml;hlten Raumebene im S&auml;ulen- und Liniendiagramm zu betrachten und <i>hervorzuheben</i>, kann mit dem <i>Mauszeiger</i> entweder &uuml;ber die <i>S&auml;ule innerhalb des S&auml;ulendiagramms</i> oder &uuml;ber das jeweilige <i>Element in der Karte</i> gefahren werden. Eine dauerhafte Selektion durch Klicken auf das kartographische Element oder die dazugeh&ouml;rige S&auml;ule erm&ouml;glicht das simultane Betrachten mehrerer Elemente.<br/><br/>Jedes Diagramm enth&auml;lt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
				onNext: function(tour){
					if($scope.sidebarDiagramsClass !== "disappear"){
							$("#sidebarDiagramsCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarDiagramsClass !== "disappear"){
							$("#sidebarDiagramsCollapse").click();
					}
				}
			},
			{
				element: "#sidebarRadarDiagramCollapse",
				title: "Indikatorenradar",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet das Indiktorenradar f&uuml;r die Querschnittsbetrachtung mehrerer Indikatoren. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarRadarDiagramClass === "disappear"){
							$("#sidebarRadarDiagramCollapse").click();
					}
				}
			},
			{
				element: "#indicatorRadar",
				title: "Indikatorenradar",
				placement: "right",
				content: "Das <b>Indikatorenradar</b> eignet sich insbesondere f&uuml;r die <b>querschnittsorientierte Betrachtung mehrerer Indikatoren</b>. <br/>F&uuml;r die Anzeige eines solchen Diagramms, <i>selektieren Sie bitte mindestens drei Indikatoren</i> aus der unten stehenden Liste. <br/><br/>F&uuml;r jeden gew&auml;hlten Indikator wird im Diagramm eine Achse genutzt, auf der einzelne Raumeinheiten anhand ihrer Wertauspr&auml;gung abgetragen werden. Jede Achse wird dabei durch <b>Minimum und Maximum</b> der Geometrien der betrachteten Raumebene gebildet (daher ist die <b><i>Radarmitte ausdr&uuml;cklich nicht zwingend mit dem Wert '0' gleichzusetzen, sondern mit dem Minimalwert des Indikators</i></b>). <br/><br/>Auch hier ist der Durchschnitt aller Raumeinheiten bereits vorberechnet und einzelne Elemente k&ouml;nnen mittels Selektion innerhalb der Karte dem Radar hinzugef&uuml;gt werden. Die Indikatorenauswahl umfasst dabei nur solche Indikatoren, die die gew&auml;hlte Raumebene und den aktuell gew&auml;hlten Zeitschnitt unterst&uuml;tzen.<br/><br/> Auch das Radardiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann",
				onNext: function(tour){
					if($scope.sidebarRadarDiagramClass !== "disappear"){
							$("#sidebarRadarDiagramCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarRadarDiagramClass !== "disappear"){
							$("#sidebarRadarDiagramCollapse").click();
					}
				}
			},
			{
				element: "#sidebarRegressionDiagramCollapse",
				title: "Regressionsdiagramm",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet Fenster zur Definition von Regressionsdiagrammen. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarRegressionDiagramClass === "disappear"){
							$("#sidebarRegressionDiagramCollapse").click();
					}
				}
			},
			{
				element: "#indicatorRegression",
				title: "Regressionsdiagramm",
				placement: "right",
				content: "Als exemplarischer weiterer Diagrammtyp unterst&uuml;tzt KomMonitor die Berechnung einer <b>linearen Regression</b> zwischen zwei zu w&auml;hlenden Indikatoren, um insbesondere die <b>Korrelation</b> zwischen diesen zu betrachten. Nach Auswahl der Indikatoren werden die Regressionsgerade und alle Elemente der gew&auml;hlten Raumebene gem&auml;ß ihrer Wertauspr&auml;gungen entlang der Indikatorenachsen im Diagramm abgetragen. <br/><br/>Beim &Uuml;berfahren eines Datenpunkts mit der Maus im Diagramm oder einer in der Karte dargestellten Raumeinheit, wird das jeweilige Pendant visuell hervorgehoben.<br/><br/>Die Indikatorenauswahl umfasst dabei nur solche Indikatoren, die die gew&auml;hlte Raumebene und den aktuell gew&auml;hlten Zeitschnitt unterst&uuml;tzen.<br/><br/> Auch das Regressionsdiagramm besitzt in der oberen rechte Ecke eine <b>Toolbox</b>, &uuml;ber die das Diagramm entweder als <b>Bilddatei</b> oder im <b>Tabellenformat</b> <b>exportiert</b> werden kann.",
				onNext: function(tour){
					if($scope.sidebarRegressionDiagramClass !== "disappear"){
							$("#sidebarRegressionDiagramCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarRegressionDiagramClass !== "disappear"){
							$("#sidebarRegressionDiagramCollapse").click();
					}
				}
			},
			{
				element: "#sidebarReachabilityCollapse",
				title: "Erreichbarkeitsanalysen",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster f&uuml;r Erreichbarkeitsanalysen. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarReachabilityClass === "disappear"){
							$("#sidebarReachabilityCollapse").click();
					}
				}
			},
			{
				element: "#kommonitorReachability",
				title: "Erreichbarkeitsanalysen",
				placement: "right",
				content: "Als GIS-basiertes Werkzeug soll KomMonitor ausgew&auml;hlte <b>r&auml;umliche Analysen</b> unterst&uuml;tzen. Insbesondere stehen <b>Erreichbarkeitsanalysen</b> im Fokus, bei denen, neben reinen <i>Puffer-basierten Ans&auml;tzen</i>, <b>Erreichbarkeiten anhand tats&auml;chlicher Wegenetze</b> f&uuml;r verschiedene <b>Transportmittel (z.B. Fußg&auml;nger, Fahrrad, Auto)</b> berechnet werden k&ouml;nnen. Konkret soll hierbei sowohl ein <b>Routing</b> zwischen einzelnen Punkten sowie die Berechnung von <b>Isochronen (&Auml;quidistanzen und zeitliches Abbruchkriterium)</b> angeboten werden.<br/><br/>Derzeit sind lediglich ausgew&auml;hlte, vordefinierte Demo-Berechnungen durchf&uuml;hrbar. Frei definierbare Erreichbarkeitsanalysen werden in K&uuml;rze implementiert.",
				onNext: function(tour){
					if($scope.sidebarReachabilityClass !== "disappear"){
							$("#sidebarReachabilityCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarReachabilityClass !== "disappear"){
							$("#sidebarReachabilityCollapse").click();
					}
				}
			},
			{
				element: "#sidebarProcessingCollapse",
				title: "Individuelle Indikatoren-Neuberechnung",
				placement: "right",
				content: "Ein Klick auf diesen Button &ouml;ffnet ein Fenster zur individuellen Neuberechnung einzelner Indikatoren. <br/><br/><i>Im n&auml;chsten Schritt wird das Men&uuml; automatisch ge&ouml;ffnet.</i>",
				onNext: function(tour){
					if($scope.sidebarProcessingClass === "disappear"){
							$("#sidebarProcessingCollapse").click();
					}
				}
			},
			{
				element: "#indicatorProcessing",
				title: "Individuelle Indikatoren-Neuberechnung",
				placement: "right",
				content: "KomMonitor ist mehr als nur ein Darstellungswerkzeug. Es erm&ouml;glicht insbesondere auch die <b>automatisierte Berechnung von Indikatoren</b>. Je nach Berechnungsvorschrift kann es dabei <b>konfigurierbare Parameter</b> geben, die die <i>resultierenden Indikatorenwerte beeinflussen</i> (bspw. eine maximle Distanz bei Erreichbarkeiten oder Gewichtungen grundlegender Eingangsdaten). <br/><br/>Dieses Men&uuml; bietet die M&ouml;glichkeit einer <b>Nutzer-definierten Neuberechnung von Indikatoren</b> mit mindestens einem konfigurierbaren Parameter. Das jeweilige Berechnungsergebnis steht anschlie&szlig;end tempor&auml;r zur Verf&uuml;gung und kann bei Bedarf exportiert werden. <br/><br/>K&uuml;nftig sollen dar&uuml;ber hinaus unmittelbare Vergleiche mit der 'Standard'-Variante des Indikators angeboten werden. Diese sind jedoch zum gegenw&auml;rtigen Zeitpunkt noch nicht in der Anwendung umgesetzt.",
				onNext: function(tour){
					if($scope.sidebarProcessingClass !== "disappear"){
							$("#sidebarProcessingCollapse").click();
					}
				},
				onPrev: function(tour){
					if($scope.sidebarProcessingClass !== "disappear"){
							$("#sidebarProcessingCollapse").click();
					}
				}
			}
		]};

		$scope.startGuidedTour = function(){
			// GUIDED TOUR
			// Instance the tour
			kommonitorDataExchangeService.guidedTour = new Tour($scope.tourOptions);

			// Initialize the tour
			kommonitorDataExchangeService.guidedTour.init();
			// Start the tour
			try{
				kommonitorDataExchangeService.guidedTour.restart();
			}
			catch(error){
					kommonitorDataExchangeService.guidedTour.start(true);
			}
		};

		$scope.$on("redrawGuidedTourElement", async function(event){

			await sleep(100);

			if(kommonitorDataExchangeService.guidedTour){
				kommonitorDataExchangeService.guidedTour.redraw();
			}
		});

	}
]});
