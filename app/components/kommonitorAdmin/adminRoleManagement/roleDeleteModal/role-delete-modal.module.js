"use strict";
angular.module('roleDeleteModal', ['kommonitorDataExchange', 'kommonitorKeycloakHelper']);
angular.module('roleDeleteModal').filter('formatJson', ['kommonitorDataExchangeService', function (kommonitorDataExchangeService) {
        return function (json) {
            return kommonitorDataExchangeService.syntaxHighlightJSON(json);
        };
    }]);
//# sourceMappingURL=role-delete-modal.module.js.map