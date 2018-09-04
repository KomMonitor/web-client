'use strict';

describe(
		'WPS CLient Application',
		function() {

			/*
			 * wpsSetup
			 */
			describe(
					'wpsSetup',
					function() {

						beforeEach(function() {
							browser.get('index.html');
						});

						it(
								'initially number of disabled navigation tabs should be "5"',
								function() {

									var list = element.all(by
											.css('.nav .disabled'));
									expect(list.count()).toBe(5);

								});

						it(
								'should switch WPS service to "http://geostatistics.demo.52north.org/wps/WebProcessingService"',
								function() {

									/*
									 * change selected WPS
									 */
									element(
											by
													.cssContainingText(
															'option',
															'http://geostatistics.demo.52north.org/wps/WebProcessingService'))
											.click();

									expect(
											element(by
													.model('http://geostatistics.demo.52north.org/wps/WebProcessingService').isSelected))
											.toBeTruthy();

								});

						it(
								'should switch WPS version from "1.0.0" to "2.0.0"',
								function() {

									expect(
											element(by.model('1.0.0').isSelected))
											.toBeTruthy();

									var version1RadioButton = element(by
											.id('wpsVersion1'));
									var version2RadioButton = element(by
											.id('wpsVersion2'));

									version2RadioButton.click();

									expect(
											element(by.model('2.0.0').isSelected))
											.toBeTruthy();

								});

					});
			

		});
