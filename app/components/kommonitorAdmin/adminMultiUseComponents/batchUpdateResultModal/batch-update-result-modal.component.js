"use strict";
angular.module('batchUpdateResultModal').component('batchUpdateResultModal', {
	templateUrl : "components/kommonitorAdmin/adminMultiUseComponents/batchUpdateResultModal/batch-update-result-modal.template.html",
	controller : ['$scope', '$rootScope', '__env',
		function BatchUpdateResultModalController($scope, $rootScope, __env) {
        
            $scope.$on("batchUpdateCompleted", function(event, data) {
				$scope.initializeResultModal(data)
				$("#modal-batch-update-result").modal("show");
			});


			$scope.$on("reopenBatchUpdateResultModal", function() {
				$("#modal-batch-update-result").modal("show");
			});

			$scope.initializeResultModal = function(data) {
				let responses = data.value;
				let resourceType = data.resourceType
	
				let resourceTypeTableHeading = $("#batch-update-result-table-resource-type")
				if (resourceType === "georesource")
					resourceTypeTableHeading.html("Georessource")
				if (resourceType === "indicator")
					resourceTypeTableHeading.html("Indikator")
	
	
				// populate table
				for(var i=0;i<responses.length;i++) {
					const response = responses[i];
		
					let tableRow = document.createElement("tr");
					let td1 = document.createElement("td");
					let td2 = document.createElement("td");
					
					td1.classList.add("batch-update-result-td1")
					td1.innerHTML = response.name;
	
					td2.classList.add("batch-update-result-td2");
		
					if(response.status == "success") {
						let successBtn = document.createElement("button");
						successBtn.classList.add("btn", "btn-success");
						successBtn.type = "button";
						successBtn.innerHTML = "Erfolg";
		
						td2.appendChild(successBtn);
					}
	
					if(response.status == "error") {
						let errorMsgDiv = document.createElement("div");
						errorMsgDiv.classList.add("card", "card-body");
						errorMsgDiv.innerHTML = response.message;
		
						let collapseDiv = document.createElement("div");
						collapseDiv.classList.add("collapse");
						collapseDiv.id = "batch-update-result-error-collapse" + i;
						collapseDiv.appendChild(errorMsgDiv);
						
						let errorBtn = document.createElement("button");
						errorBtn.classList.add("btn", "btn-danger");
						errorBtn.type = "button";
						$(errorBtn).attr("data-toggle", "collapse");
						$(errorBtn).attr("data-target", "#batch-update-result-error-collapse" + i);
						$(errorBtn).attr("aria-expanded", "false");
						$(errorBtn).attr("aria-controls", "batch-update-result-error-collapse" + i)
						errorBtn.innerHTML = "Fehler";
						td2.appendChild(errorBtn);
		
						insertAfter(errorBtn, collapseDiv);
					}
		
					tableRow.appendChild(td1);
					tableRow.appendChild(td2);
					document.getElementById("batch-update-result-table-tbody").appendChild(tableRow);
				}
				
				//utility function to insert a node after another one. By default nodes get inserted at the front
				function insertAfter(referenceNode, newNode) {
					referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
				}
			}
        }
    ]
});