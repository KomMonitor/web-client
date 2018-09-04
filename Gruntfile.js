module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        name: 'wps-js-client',
        context_name: '<%= name %>##<%= pkg.version %>-<%= grunt.template.today("yyyymmddHHMM")%>',
        lib_scripts: [
            'app/bower_components/jquery/dist/jquery.min.js',
		  	'app/bower_components/bootstrap/dist/js/bootstrap.min.js',
			'app/bower_components/angular/angular.min.js',
			'app/bower_components/angular-translate/angular-translate.min.js',
			'app/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
			'app/bower_components/leaflet/dist/leaflet.js',
			'app/bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.min.js',
			'app/bower_components/leaflet-draw/dist/leaflet.draw-src.js',
			'app/bower_components/wps-js/index.js'
        ],
        lib_styles: [
            'app/bower_components/bootstrap/dist/css/bootstrap.min.css',
			'app/bower_components/leaflet/dist/leaflet.css',
			'app/bower_components/leaflet-draw/dist/leaflet.draw.css'
        ],
        wps_js_client: [
            'app/util/genericServices/wpsFormControlService/wps-form-control.module.js',
			'app/util/genericServices/wpsExecuteInputService/wps-execute-input.module.js',
			'app/util/genericServices/wpsExecuteOutputService/wps-execute-output.module.js',
			'app/util/genericServices/wpsService/wps-properties.module.js',
			'app/util/genericServices/wpsInputOutputFilterService/wps-input-output-filter.module.js',
			'app/util/genericServices/wpsGeometricOutputService/wps-geometric-output.module.js',
			'app/components/wpsUserInterface/wpsControls/wps-controls.module.js',
			'app/components/wpsUserInterface/wpsControls/wps-controls.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsSetup/wps-setup.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsSetup/wps-setup.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsSetup/modal/wps-add-service-modal.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsSetup/modal/wps-add-service-modal.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsSetup/wpsChangeLanguage/wps-change-language.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsSetup/wpsChangeLanguage/wps-change-language.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wps-capabilities.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wps-capabilities.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceIdentification/wps-capabilities-service-identification.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceIdentification/wps-capabilities-service-identification.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceProvider/wps-capabilities-service-provider.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceProvider/wps-capabilities-service-provider.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceOperations/wps-capabilities-service-operations.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsCapabilities/wpsCapabilitiesServiceOperations/wps-capabilities-service-operations.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wps-processes.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wps-processes.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wps-process-description.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wps-process-description.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsGeneralProcessInformation/wps-general-process-information.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsGeneralProcessInformation/wps-general-process-information.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wps-process-inputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wps-process-inputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsLiteralInputs/wps-literal-inputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsLiteralInputs/wps-literal-inputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsComplexInputs/wps-complex-inputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsComplexInputs/wps-complex-inputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsBoundingBoxInputs/wps-bounding-box-inputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessInputs/wpsBoundingBoxInputs/wps-bounding-box-inputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wps-process-outputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wps-process-outputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsLiteralOutputs/wps-literal-outputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsLiteralOutputs/wps-literal-outputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsComplexOutputs/wps-complex-outputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsComplexOutputs/wps-complex-outputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsBoundingBoxOutputs/wps-bounding-box-outputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsProcesses/wpsProcessDescription/wpsProcessOutputs/wpsBoundingBoxOutputs/wps-bounding-box-outputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wps-execute.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wps-execute.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wps-execute-setup-request.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wps-execute-setup-request.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupInputs/wps-execute-setup-inputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupInputs/wps-execute-setup-inputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupOutputs/wps-execute-setup-outputs.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupOutputs/wps-execute-setup-outputs.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupParameters/wps-execute-setup-parameters.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupParameters/wps-execute-setup-parameters.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteResultDocument_WPS_2_0/wps-execute-result-document-wps-2-0.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteResultDocument_WPS_2_0/wps-execute-result-document-wps-2-0.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteStatusInfoDocument_WPS_2_0/wps-execute-status-info-document-wps-2-0.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteStatusInfoDocument_WPS_2_0/wps-execute-status-info-document-wps-2-0.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteResponseDocument_WPS_1_0/wps-execute-response-document-wps-1-0.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteResponseDocument_WPS_1_0/wps-execute-response-document-wps-1-0.component.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteRawOutput/wps-execute-raw-output.module.js',
			'app/components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteRawOutput/wps-execute-raw-output.component.js',
			'app/components/wpsUserInterface/wpsMap/wps-map.module.js',
			'app/components/wpsUserInterface/wpsMap/wps-map.component.js',
			'app/components/wpsUserInterface/wps-user-interface.module.js',
			'app/components/wpsUserInterface/wps-user-interface.component.js',
			'app/app.js'
			
			
        ],
        wps_styles: [
            'app/app.css'
        ],
        copy_files: [
            //the path prefix 'app/' will be set in the copy-command itself! Thus is omitted here.
            'i18n/*',
			'components/**/*.template.html'
            
        ],
        copy_css: [
        
            // path to CSS-related files that require copying
            // the path prefix to leaflet-draw folder will be set in the copy-command itself! Thus is omitted here.
            'images/**'      
            
        ],
        copy_fonts: [
                   
                   // path to Bootstrap fonts-related files that require copying
                   // the path prefix to bootstrap will be set in the copy-command itself! Thus is omitted here.
                   'fonts/**'      
                   
               ],
        clean: ["dist/"],
        tags: {
            options: {
                scriptTemplate: '<script src="{{ path }}" type="text/javascript"></script>',
                linkTemplate: '<link href="{{ path }}" rel="stylesheet" type="text/css"/>'
            },
            build_lib_scripts: {
                options: {
                    openTag: '<!-- start lib script tags -->',
                    closeTag: '<!-- end lib script tags -->'
                },
                src: ['<%= lib_scripts %>'],
                dest: 'app/index.html'
            },
            build_client_scripts: {
                options: {
                    openTag: '<!-- start client script tags -->',
                    closeTag: '<!-- end client script tags -->'
                },
                src: ['<%= wps_js_client %>'],
                dest: 'app/index.html'
            },
            build_lib_styles: {
                options: {
                    openTag: '<!-- start lib style tags -->',
                    closeTag: '<!-- end lib style tags -->'
                },
                src: ['<%= lib_styles %>'],
                dest: 'app/index.html'
            },
            build_client_styles: {
                options: {
                    openTag: '<!-- start client style tags -->',
                    closeTag: '<!-- end client style tags -->'
                },
                src: ['<%= wps_styles %>'],
                dest: 'app/index.html'
            }
        },
        concat: {
            libs: {
                src: ['<%= lib_scripts %>'],
                dest: 'dist/js/deps.<%= name %>.min.js'
            },
            wps: {
                src: '<%= wps_js_client %>',
                dest: 'dist/js/wps-js-client-all.js'
            },
            styles: {
                src: '<%= wps_styles %>',
                dest: 'dist/css/<%= name %>.css'
            },
            libStyles: {
                src: '<%= lib_styles %>',
                dest: 'dist/css/deps.<%= name %>.css'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= name %> <%= grunt.template.today("yyyy-mm-dd HH:MM") %> */\n'
            },
            appJs: {
                files: {
                    'dist/wps-js-client-all.min.js': ['<%= concat.wps.dest %>']
                }
            }
        },
        cssmin: {
            options: {
            },
            styles: {
                files: {
                    'dist/css/<%= name %>.min.css': ['<%= concat.styles.dest %>']
                }
            },
            depStyles: {
                files: {
                    'dist/css/deps.<%= name %>.min.css': ['<%= concat.libStyles.dest %>']
                }
            }
        },
        copy: {
            locals: {
                files: [
                    {expand: true, flatten: false, cwd: 'app/', src: '<%= copy_files %>', dest: 'dist/'},
                ]
            },
	        css: {
	            files: [
	                {expand: true, flatten: false, cwd: 'app/bower_components/leaflet-draw/dist/', src: '<%= copy_css %>', dest: 'dist/css'},
	            ]
	        },
	        fonts: {
	            files: [
	                {expand: true, flatten: false, cwd: 'app/bower_components/bootstrap/', src: '<%= copy_fonts %>', dest: 'dist/'},
	            ]
	        }
        },
        //lint the source files
        jshint: {
            files: ['gruntfile.js', 'app/util/**/*.js', 'app/components/**/*.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                }
            }
        },
        processhtml: {
            options: {
                data: {
                    message: '<%= name %> - version <%= pkg.version %> - build at <%= grunt.template.today("yyyy-mm-dd HH:MM") %>'
                }
            },
            index: {
                files: {
                    'dist/index.html': ['app/index.html']
                }
            }
        },
        watch: {
            less: {
                files: [ 'bower.json' ],
                tasks: [ 'exec:bower_install' ]
			},
			hint: {
				files: ['<%= jshint.files %>'],
				tasks: ['jshint']
			}
        },
		exec: {
			bower_install: {
                cmd: "bower install"
			}
		},
        war: {
            target: {
                options: {
                    war_dist_folder: 'build/',
                    war_name: '<%= context_name %>',
                    webxml_welcome: 'index.html',
                    webxml_display_name: '<%= name %> - version <%= pkg.version %> - build at <%= grunt.template.today("yyyy-mm-dd HH:MM") %>',
                    webxml_mime_mapping: [
                        {
                            extension: 'xml',
                            mime_type: 'application/xml'
                        }]
                },
                files: [
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: ['**'],
                        dest: ''
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-script-link-tags');
    grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-war');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('copy-all', ['copy:locals', 'copy:css', 'copy:fonts']);
    grunt.registerTask('copy-css', ['copy:css']);
    grunt.registerTask('copy-fonts', ['copy:fonts']);
    grunt.registerTask('env-build', ['tags']);
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'cssmin', 'copy', 'processhtml']);
	grunt.registerTask('buildDebugScript', ['clean', 'concat']);

	grunt.registerTask('buildWar', ['default', 'war']);
//  grunt.registerTask('buildWar', ['test', 'default', 'war']);
};
