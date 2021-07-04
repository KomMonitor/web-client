angular.module('indicatorBatchUpdateModal', ['kommonitorImporterHelper', 'kommonitorBatchUpdateHelper', 'ngSanitize', 'ui.select']);

angular.module('indicatorBatchUpdateModal').filter('filterIndicators', function() {
    return function(indicators, props) {
        // props is an object
        // properties can be defined when calling the filter, e. g. { indicatorName }
        var result = []
        var searchTermLower;
        if (props.hasOwnProperty("indicatorName"))
            searchTermLower = props.indicatorName.toLowerCase()
        else
            console.error("Given prarameter 'props' does not have a property named 'indicatorName'.")
            
        angular.forEach(indicators, function(indicator) {
            if(indicator.indicatorName.toLowerCase().includes( searchTermLower ))
                result.push(indicator)
        })
        return result;
    }
})