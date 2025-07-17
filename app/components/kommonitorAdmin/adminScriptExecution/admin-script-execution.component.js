angular.module('adminScriptExecution').component('adminScriptExecution', {
	templateUrl: "components/kommonitorAdmin/adminScriptExecution/admin-script-execution.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', '$scope', '$rootScope', '__env', '$timeout', '$http', 
		function JobExecutionController(kommonitorDataExchangeService, kommonitorDataGridHelperService, $scope, $rootScope, __env, $timeout, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.selectAllEntriesInput = false;

		$scope.jobDescriptions = [];

		$scope.fetchJobDescriptions = async function(){
            return await $http({
              url: __env.targetUrlToProcessesApi + "jobs?limit=50",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                $scope.jobDescriptions = response.data.jobs;

				// also start to fetch job details for all queried jobs
				// in the background
				$scope.fetchJobDetails($scope.jobDescriptions);
              });
		  };

		$scope.fetchJobDetails = async function(jobDescriptions){
			// let jobDescriptions_withJobSummary = [];
			for (const jobDescription of jobDescriptions) {
				if(!jobDescription.jobSummary){
					await $http({
					url: __env.targetUrlToProcessesApi + "jobs/" + jobDescription.jobID + "/results",
					method: "GET"
					}).then(function successCallback(response) {
						// this callback will be called asynchronously
						// when the response is available

						// this is only the jobSummayr as response
						// let clone = jQuery.extend(true, {}, jobDescription);
						jobDescription.jobSummary = response.data.jobSummary;

						// jobDescriptions_withJobSummary.push(clone);
				});
				}
				
			}

			return jobDescriptions;
		}  
		 
		$scope.$on("initialMetadataLoadingCompleted", function (event) {


			$timeout(async function () {

				await $scope.fetchJobDescriptions();

				$scope.initializeOrRefreshOverviewTable();
			}, 250);

		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

			$scope.loadingData = false;

		});

		$scope.initializeOrRefreshOverviewTable = function () {
			$scope.loadingData = true;

			kommonitorDataGridHelperService.buildDataGrid_processJobs($scope.jobDescriptions);

			$scope.loadingData = false;
		};

		$scope.onJobStatusClicked = async function (status){
			$scope.selectedStatus = status;

			$scope.filteredJobDescriptions = [];

			for (let job of $scope.jobDescriptions) {
				if (job.status == status) {
					$scope.filteredJobDescriptions.push(job);
				}
			}

			// for each filtered job entry, we must fetch jkob details, as only then we get detailed 
			// jobSummary for the respective data grid

			$scope.filteredJobDescriptions_withJobSummary = await $scope.fetchJobDetails($scope.filteredJobDescriptions);
			kommonitorDataGridHelperService.buildDataGrid_processJobs($scope.filteredJobDescriptions_withJobSummary);
		}

		$scope.$on("refreshJobOverviewTable", function (event) {
			$scope.loadingData = true;
			$scope.refreshJobOverviewTable();
		});

		$scope.refreshJobOverviewTable = async function () {

			// refetch all metadata from spatial units to update table
			await $scope.fetchJobDescriptions();

			$timeout(async function () {

				$scope.initializeOrRefreshOverviewTable();

				$scope.loadingData = false;
			});
			

		};

		$scope.syntaxHighlightJSON = function(json){
			return kommonitorDataExchangeService.syntaxHighlightJSON(json);
		};

		$scope.getNumberForStatus = function(status){
			let i = 0;
			for (const job of $scope.jobDescriptions) {
				if (job.status == status){
					i++;
				}
			}
			return i;
		}

		$scope.statusDescriptions = {
			accepted: {
				title: "wartende Jobs",
				backgroundClass: "bg-orange",
			},
			// delayed: { // not supported by pyGeoAPI as of July 2025
			// 	title: "verzögerte Jobs",
			// 	backgroundClass: "bg-gray",
			// },
			running: {
				title: "laufende Jobs",
				backgroundClass: "bg-aqua",
			},
			failed: {
				title: "gescheiterte Jobs",
				backgroundClass: "bg-red",
			},
			successful: {
				title: "abgeschlossene Jobs",
				backgroundClass: "bg-green",
			}
		}
	}
	]
});
