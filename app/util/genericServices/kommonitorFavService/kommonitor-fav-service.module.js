angular.module('kommonitorFavService', []);

angular
  .module('kommonitorFavService', [])
  .service(
    'kommonitorFavService', [ 
    '$http', '__env', 'Auth', '$routeParams', '$location',
    function ($http, __env, Auth, $location) {

      var self = this;
      this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
      this.userInfoExists = false;
      this.userInfoId = undefined;

      this.bodyTemplate = {
        "georesourceFavourites": [],
        "indicatorFavourites": [],
        "georesourceTopicFavourites": [],
        "indicatorTopicFavourites": []
      };
      this.favObject = self.bodyTemplate;
  
      this.prepBody = function(favorites, fullBody = false) {
        
        //assign items
        Object.keys(self.bodyTemplate).forEach(function(key) {
          if(favorites[key] !== undefined)
            self.favObject[key] = favorites[key];
        });
      }

      this.handleFavSelection = function(favorites) {
        this.prepBody(favorites, !self.userInfoExists);
      }

      this.getUserInfo = function() {
        return self.favObject;
      }

      this.storeFavSelection = function() {

      /*   $http({
          url: `${this.baseUrlToKomMonitorDataAPI}/userInfos/${self.userInfoId}`,
          method: "DELETE"
        }).then(async function successCallback(response) {			
          self.userInfoExists = true;
          self.favObject = response.data;
          console.log("userInfo data initialized");
          }, function errorCallback(error) {
            console.log("Unable to store userInfo data");
        });  */

        var body = self.favObject;
        delete(body.userInfoId);
        delete(body.keycloakId);

        if(self.userInfoExists===true) {

          $http({
            url: `${this.baseUrlToKomMonitorDataAPI}/userInfos/${self.userInfoId}`,
            method: "PUT",
            data: body
          }).then(async function successCallback(response) {			
            console.log("userInfo data patched");
            self.favObject = response.data;
            }, function errorCallback(error) {
              console.log("Unable to store userInfo data");
          }); 
        } else {
          // userInfo does not exist yet, make initial post call

          $http({
            url: `${this.baseUrlToKomMonitorDataAPI}/userInfos`,
            method: "POST",
            data: body
          }).then(async function successCallback(response) {			
            self.userInfoExists = true;
            self.userInfoId = response.data.userInfoId;
            self.favObject = response.data;
            console.log("userInfo data initialized");
            }, function errorCallback(error) {
              console.log("Unable to store userInfo data");
          }); 
        }
      }

      this.init = function(){
        console.log("Favs init");
        $http.get(`${this.baseUrlToKomMonitorDataAPI}/userInfos/user`, {'responseType': 'text'}).then(function (response) {
          if(response.data.userInfoId) {
            self.userInfoExists = true;
            self.userInfoId = response.data.userInfoId;
            self.favObject = response.data;
          }
        });
      };

    }]);
