angular.module('wpsGeometricOutput', [ ]);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 * 
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 * 
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular.module('wpsGeometricOutput').service('wpsGeometricOutputService', 
		[ function() {

			this.getGeometricOutputs = function(allOutputs){
				
				/*
				 * inspect array of outputs for geometric outputs only
				 * 
				 * first concentrate on GeoJSON output
				 * 
				 * TODO future task: transform other geometric formats to GeoJSON
				 * using a special WPS 
				 */
				
				/*
				 * create empty new array "geometricOutputs"
				 */
				
				var geometricOutputs = new Array();
				
				/*
				 * only geometric outputs shall be put into array "geometricOutputs"
				 */
				
				for (i=0; i < allOutputs.length; i++){
					var currentOutput = allOutputs[i];

					// is geometric output?
					if(this.isGeometricFormat(currentOutput)){
						
						/*
						 * outputs may be "as reference" or "as value"
						 * hence, an output may have different properties
						 */
						if(currentOutput.reference){
							/*
							 * output is as reference
							 */
							
							// is GeoJSON
							if(this.isGeoJSON(currentOutput))
								geometricOutputs.push(currentOutput);
							
							// is WMS (will be a complexOutput with mimeType = application/WMS)
							else if(this.isWMS(currentOutput))
								geometricOutputs.push(currentOutput);
							
							// is not GeoJSON but can be converted to GeoJSON								
							else if(this.canBeTransformedToGeoJSON(currentOutput)){
								
							}
							
						} else{
							/*
							 * output is as value! hence has .data property
							 */
							
							/*
							 * bounding box outputs will be transformed to GeoJSON by wps-map.module.js
							 */
							
							if(currentOutput.data.boundingBoxData)
								geometricOutputs.push(currentOutput);
							
							// is GeoJSON
							else if(this.isGeoJSON(currentOutput))
								geometricOutputs.push(currentOutput);
							
							else if(this.isWMS(currentOutput))
								geometricOutputs.push(currentOutput);
							
							// is not GeoJSON but can be converted to GeoJSON								
							else if(this.canBeTransformedToGeoJSON(currentOutput)){
								/*
								 * TODO transform to GeoJSOn using special WPS instance
								 * 
								 * and add to "geometricOutputs" array
								 */
							}
						}
						
					}
				}
				
				/*
				 * new all geometric outputs have been found.
				 * 
				 * return array "geometricOutputs"
				 */
				return geometricOutputs;
			};
			
			this.isGeometricFormat = function(currentOutput){
				/*
				 * check if mimeType / format of output is supported
				 */
				
				/*
				 * output might be stored as Reference or as value
				 */
				
				if(currentOutput.reference){
					/*
					 * output is given as reference
					 */
					
					return this.isGeometricFormat_reference(currentOutput);
					
				} else{
					
					/*
					 * output is given as value
					 */
				
					if(currentOutput.data.complexData)
						return this.isGeometricFormat_complexData(currentOutput);
					
					//bounding box is always geometric
					else if(currentOutput.data.boundingBoxData)
						return true;
					
					else 
						return false;
				
				}
			};
			
			this.isGeometricFormat_reference = function(currentOutput){
				var reference = currentOutput.reference;
				var format = reference.format;
				
				if (this.isFormatSupported(format))
					return true;
				
				else
					return false;
			};
			
			this.isGeometricFormat_complexData = function(currentOutput){
				var format = currentOutput.data.complexData.mimeType;
				
				if (this.isFormatSupported(format))
					return true;
				
				else
					return false;
			};
			
			this.isFormatSupported = function(format){
				/*
				 * TODO implement better way using an external file of supported formats
				 */
				
				if (format === 'application/vnd.geo+json')
					return true;
				else if (format === 'application/WMS')
					return true;
			};
			
			this.isGeoJSON = function(currentOutput){
				/*
				 * output can be as reference or as value
				 *  properties differ!
				 */
				
				var format;
				
				if(currentOutput.reference){
					/*
					 * as reference
					 */
					format = currentOutput.reference.format;
				}
				else{
					/*
					 * has .data property and will be a complexOutput!
					 */
					format = currentOutput.data.complexData.mimeType;
				}
				
				if (this.isGeoJSON_mimeType(format))
					return true;
				
				return false;
			};
			
			this.isGeoJSON_mimeType = function(mimeType){
				
				if (mimeType === 'application/vnd.geo+json')
					return true;
				
				return false;
			};
			
			this.isWMS = function(currentOutput){
				/*
				 * output can be as reference or as value
				 *  properties differ!
				 */
				
				var format;
				
				if(currentOutput.reference){
					/*
					 * as reference
					 */
					format = currentOutput.reference.format;
				}
				else{
					/*
					 * has .data property and will be a complexOutput!
					 */
					format = currentOutput.data.complexData.mimeType;
				}
				
				if (format === 'application/WMS')
					return true;
			};
			
			this.canBeTransformedToGeoJSON = function(currentOutput){
				/*
				 * TODO implement
				 */
				
				/*
				 * if output is a bounding box, than return true,
				 * as it can always be transformed to GeoJSON!
				 */
				if (currentOutput.data.boundingBoxData)
					return true;
			};
			
			this.transformToGeoJSON = function(currentOutput){
				/*
				 * TODO implement using a special WPS that transforms 
				 * the output to GeoJSON
				 */
			};

		} ]);