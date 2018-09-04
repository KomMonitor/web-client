angular.module('wpsInputOutputFilter', []);

/**
 * provides methods to filter input lists for their type (literalData,
 * complexData, boundingBoxData)
 */
angular.module('wpsInputOutputFilter').service('wpsInputOutputFilterService', function() {

	this.hasLiteralData = function(object) {
		if (object.literalData)
			return true;

		return false;
	},

	this.hasComplexData = function(object) {
		if (object.complexData)
			return true;

		return false;
	},

	this.hasBoundingBoxData = function(object) {
		if (object.boundingBoxData)
			return true;

		return false;
	}

});