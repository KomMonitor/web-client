angular.module('kommonitorFavService', []);

angular
  .module('kommonitorFavService', [])
  .service(
    'kommonitorFavService', [ 
    '$http', '__env', 'Auth', '$routeParams', '$location',
    function ($http, __env, Auth, $location) {

      this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
  
      this.handleFavSelection = function(favObject) {
        console.log(favObject);
      }

      this.init = function(){
        console.log("Favs init");
      };

    }]);
