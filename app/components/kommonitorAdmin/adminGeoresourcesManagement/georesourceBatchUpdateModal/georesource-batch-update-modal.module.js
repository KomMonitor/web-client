angular.module('georesourceBatchUpdateModal', ['kommonitorImporterHelper', 'kommonitorBatchUpdateHelper', 'ngSanitize', 'ui.select']);

angular.module('georesourceBatchUpdateModal').filter('filterGeoresoures', function() {
    return function(georesources, props) {
        // props is an object
        // properties can be defined when calling the filter, e. g. { indicatorName }
        var result = []
        var searchTermLower;

        if (props.hasOwnProperty("georesourceName"))
            searchTermLower = props.georesourceName.toLowerCase()
        else
            console.error("Given prarameter 'props' does not have a property named 'georesourceName'.")
            
        angular.forEach(georesources, function(georesource) {
            if(georesource.datasetName.toLowerCase().includes( searchTermLower ) && georesource.userPermissions.includes("editor"))
                result.push(georesource)
        })
        return result;
    }
})