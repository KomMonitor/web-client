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
      this.userInfo = {};

      this.bodyTemplate = {
        "georesourceFavourites": [],
        "indicatorFavourites": [],
        "georesourceTopicFavourites": [],
        "indicatorTopicFavourites": []
      };
      this.favObject = this.bodyTemplate;
  
      this.prepBody = function(favorites, fullBody = false) {
        
        var returnBody = this.bodyTemplate;
        Object.keys(returnBody).forEach(function(key) {

          if(favorites[key] !== undefined)
            returnBody[key] = favorites[key];
          else {
            if(fullBody===false)
              delete(returnBody[key]);
          }
        });

        return returnBody;
      }

      this.handleFavSelection = function(favorites) {
        self.favObject = this.prepBody(favorites, !self.userInfoExists);
        console.log(self.favObject);
      }

      this.getUserInfo = function() {
        return self.userInfo;
      }

      this.storeFavSelection = function() {

        if(self.userInfoExists===true) {

          $http({
            url: `${this.baseUrlToKomMonitorDataAPI}/userInfos/${self.userInfo.userInfoId}`,
            method: "PATCH",
            data: self.favObject
          }).then(async function successCallback(response) {			
            console.log("userInfo data patched");
            self.userInfo = response.data;
            }, function errorCallback(error) {
              console.log("Unable to store userInfo data");
          }); 
        } else {
          // userInfo does not exist yet, make initial post call

        /*   $http({
            url: `${this.baseUrlToKomMonitorDataAPI}/userInfos`,
            method: "POST",
            data: self.favObject
          }).then(async function successCallback(response) {			
            self.userInfoExists = true;
            self.userInfo = response.data;
            console.log("userInfo data initialized");
            }, function errorCallback(error) {
              console.log("Unable to store userInfo data");
          });  */
        }
      }

      this.init = function(){
        console.log("Favs init");
        $http.get(`${this.baseUrlToKomMonitorDataAPI}/userInfos/user`, {'responseType': 'text'}).then(function (response) {
          if(response.data.userInfoId) {
            self.userInfoExists = true;
            self.userInfo = response.data;
          }
        });

       /*  .catch(function (response) {
					console.log("fail", response);
        }) */
      };

    }]);
