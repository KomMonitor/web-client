"use strict";
angular.module('feedbackModal').component('feedbackModal', {
    templateUrl: "components/kommonitorUserInterface/kommonitorControls/feedbackModal/feedback-modal.template.html",
    controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function FeedbackModalController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            const feedbackMailRecipient = __env.feedbackMailRecipient;
            const emailURL = __env.targetUrlToProcessingEngine + "feedback-mail";
            // $scope.titel;
            $scope.organization;
            $scope.contactDetails;
            $scope.feedbackType = undefined;
            $scope.feedbackContent;
            $scope.like = undefined;
            $scope.attachment = undefined;
            document.getElementById("attachment").value = "";
            $scope.error = undefined;
            $scope.success = undefined;
            var fileToBase64 = (file) => {
                return new Promise(resolve => {
                    var reader = new FileReader();
                    // Read file content on file loaded event
                    reader.onload = function (event) {
                        resolve(event.target.result);
                    };
                    // Convert data to base64
                    reader.readAsDataURL(file);
                });
            };
            $scope.onSubmit = async function () {
                // var body = "Titel:  " + $scope.titel + "\n";
                var body = "Fachbereich/Organisation:  " + $scope.organization + "\n\n";
                body += "Kontaktdaten:  " + $scope.contactDetails + "\n\n";
                body += "Feedback Typ:  " + $scope.feedbackType + "\n\n";
                body += "Feedback Inhalt:  " + $scope.feedbackContent + "\n\n";
                body += "KomMonitor Bewertung:  " + $scope.like + "\n\n";
                // var blobFile = $('#attachment').files[0];
                var files = document.getElementById('attachment').files;
                if (files.length > 0) {
                    var uploadFile = files[0];
                    var base64 = await fileToBase64(uploadFile);
                    $scope.attachment = base64;
                }
                // var formData = undefined;
                //
                // if(files.length > 0){
                // 	formData = new FormData();
                //
                // 	for (var i = 0; i < files.length; i++) {
                // 		formData.append("files[]", files[i]);
                // 	}
                //
                // }
                var mailInput = {};
                mailInput.recipientMail = feedbackMailRecipient;
                mailInput.subject = "KomMonitor - Feedback";
                mailInput.body = body;
                mailInput.attachment = $scope.attachment;
                $scope.sendMail(mailInput);
            };
            $scope.sendMail = function (mailInput) {
                if (!$scope.validate()) {
                    return;
                }
                $scope.error = undefined;
                $scope.success = undefined;
                $http({
                    url: emailURL,
                    method: "POST",
                    data: mailInput
                }).then(function successCallback(response) {
                    $scope.error = undefined;
                    $scope.success = true;
                    $("#mailSuccessInfo").show();
                    // auto-close after 3 seconds
                    // setTimeout(function() {
                    //     $("#mailSuccessInfo").alert('close');
                    // }, 3000);
                }, function errorCallback(error) {
                    $scope.error = error;
                    $scope.success = undefined;
                    $("#mailErrorInfo").show();
                });
            };
            $scope.onCloseSuccessAlert = function () {
                $("#mailSuccessInfo").hide();
            };
            $scope.onCloseErrorAlert = function () {
                $("#mailErrorInfo").hide();
            };
            $scope.validate = function () {
                if ($scope.feedbackType && $scope.feedbackContent) {
                    return true;
                }
                return false;
            };
            $scope.reset = function () {
                $scope.organization = undefined;
                $scope.contactDetails = undefined;
                $scope.feedbackType = undefined;
                $scope.feedbackContent = undefined;
                $scope.like = undefined;
                $scope.attachment = undefined;
                document.getElementById("attachment").value = "";
                $scope.error = undefined;
                $scope.success = undefined;
            };
        }
    ]
});
//# sourceMappingURL=feedback-modal.component.js.map