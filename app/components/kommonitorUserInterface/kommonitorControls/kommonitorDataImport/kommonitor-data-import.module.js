angular.module('kommonitorDataImport', [ 'kommonitorDataExchange', 'kommonitorMap', 'ngSanitize', 
'kommonitorToastHelper', 'kommonitorFileHelper']);

angular.module('kommonitorDataImport').directive('droppable', ['$rootScope', function($rootScope) {
    return {
        scope: {
            drop: '&' // parent
        },
        link: function(scope, element) {
            // again we need the native object
            var el = element[0];

            el.addEventListener(
                'dragover',
                function(e) {
                    e.dataTransfer.dropEffect = 'move';
                    // allows us to drop
                    if (e.preventDefault) e.preventDefault();
                    this.classList.add('over');
                    return false;
                },
                false
            );

            el.addEventListener(
                'dragenter',
                function(e) {
                    this.classList.add('over');
                    return false;
                },
                false
            );

            el.addEventListener(
                'dragleave',
                function(e) {
                    this.classList.remove('over');
                    return false;
                },
                false
            );

            el.addEventListener(
                'drop',
                function(e) {
                    // Stops some browsers from redirecting.
                    if (e.stopPropagation) e.stopPropagation();

                    // Prevent default behavior (Prevent file from being opened)
                    if (e.preventDefault()) e.preventDefault();

                    this.classList.remove('over');

                    $rootScope.$broadcast("onDropFile", e);


                    return false;
                },
                false
            );
        }
    }
}]);
