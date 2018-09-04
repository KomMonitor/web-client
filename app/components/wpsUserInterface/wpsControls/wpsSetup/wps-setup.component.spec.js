describe('WpsSetupTest', function() {

  // Load the module
  beforeEach(module('wpsControls'));

  // Test the controller
  describe('WpsSetupController', function() {

    it('should have two preset WPS', inject(function($componentController) {
      var ctrl = $componentController('wpsSetup');

      expect(ctrl.wpsPropertiesServiceInstance.availableWpsServices.length).toBe(2);
    }));
    
    it('should have "undefined" as pre-selectedValue', inject(function($componentController) {
        var ctrl = $componentController('wpsSetup');

        expect(ctrl.wpsPropertiesServiceInstance.selectedServiceUrl).toBe('');
      }));
    
    it('should have "1.0.0" as pre-selected service version', inject(function($componentController) {
        var ctrl = $componentController('wpsSetup');

        expect(ctrl.wpsPropertiesServiceInstance.serviceVersion).toBe("1.0.0");
      }));

  });

});