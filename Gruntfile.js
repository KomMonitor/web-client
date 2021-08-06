module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        name: 'kommonitor-client',
        context_name: '<%= name %>##<%= pkg.version %>-<%= grunt.template.today("yyyymmddHHMM")%>',
        kommonitor_client: [
            'app/util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module.js',
            'app/util/genericServices/kommonitorDiagramHelperService/kommonitor-diagram-helper-service.module.js',
            'app/util/genericServices/kommonitorImporterHelperService/kommonitor-importer-helper-service.module.js',
            'app/util/genericServices/kommonitorScriptHelperService/kommonitor-script-helper-service.module.js',
            'app/util/genericServices/kommonitorConfigStorageService/kommonitor-config-storage-service.module.js',
            'app/util/genericServices/kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module.js',
            'app/util/genericServices/kommonitorDataGridHelperService/kommonitor-data-grid-helper-service.module.js',
            'app/util/genericServices/kommonitorVisualStyleHelperService/kommonitor-visual-style-helper-service.module.js',
            'app/util/genericServices/kommonitorElementVisibilityHelperService/kommonitor-element-visibility-helper-service.module.js',
            'app/util/genericServices/kommonitorInfoLegendHelperService/kommonitor-info-legend-helper-service.module.js',
            'app/util/genericServices/kommonitorBatchUpdateHelperService/kommonitor-batch-update-helper-service.module.js',
            'app/util/genericServices/kommonitorFilterHelperService/kommonitor-filter-helper-service.module.js',            
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDataSetup/kommonitor-data-setup.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDataSetup/kommonitor-data-setup.component.js',
            'app/components/kommonitorAdmin/adminDashboardManagement/admin-dashboard-management.module.js',
            'app/components/kommonitorAdmin/adminDashboardManagement/admin-dashboard-management.component.js',
            'app/components/kommonitorAdmin/adminRoleManagement/admin-role-management.module.js',
            'app/components/kommonitorAdmin/adminRoleManagement/admin-role-management.component.js',
            'app/components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.module.js',
            'app/components/kommonitorAdmin/adminRoleManagement/roleAddModal/role-add-modal.component.js',
            'app/components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.module.js',
            'app/components/kommonitorAdmin/adminRoleManagement/roleEditMetadataModal/role-edit-metadata-modal.component.js',
            'app/components/kommonitorAdmin/adminRoleManagement/roleDeleteModal/role-delete-modal.module.js',
            'app/components/kommonitorAdmin/adminRoleManagement/roleDeleteModal/role-delete-modal.component.js',
            'app/components/kommonitorAdmin/adminTopicsManagement/admin-topics-management.module.js',
            'app/components/kommonitorAdmin/adminTopicsManagement/admin-topics-management.component.js',
            'app/components/kommonitorAdmin/adminTopicsManagement/topicEditModal/topic-edit-modal.module.js',
            'app/components/kommonitorAdmin/adminTopicsManagement/topicEditModal/topic-edit-modal.component.js',
            'app/components/kommonitorAdmin/adminTopicsManagement/topicDeleteModal/topic-delete-modal.module.js',
            'app/components/kommonitorAdmin/adminTopicsManagement/topicDeleteModal/topic-delete-modal.component.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/admin-spatial-units-management.module.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/admin-spatial-units-management.component.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.module.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.component.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.module.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.module.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitDeleteModal/spatial-unit-delete-modal.module.js',
            'app/components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitDeleteModal/spatial-unit-delete-modal.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/admin-indicators-management.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/admin-indicators-management.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorAddModal/indicator-add-modal.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorAddModal/indicator-add-modal.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorBatchUpdateModal/indicator-batch-update-modal.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorBatchUpdateModal/indicator-batch-update-modal.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditMetadataModal/indicator-edit-metadata-modal.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditMetadataModal/indicator-edit-metadata-modal.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.component.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorDeleteModal/indicator-delete-modal.module.js',
            'app/components/kommonitorAdmin/adminIndicatorsManagement/indicatorDeleteModal/indicator-delete-modal.component.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/admin-georesources-management.module.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/admin-georesources-management.component.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceAddModal/georesource-add-modal.module.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceAddModal/georesource-add-modal.component.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.module.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.component.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.module.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.component.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditMetadataModal/georesource-edit-metadata-modal.module.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditMetadataModal/georesource-edit-metadata-modal.component.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceDeleteModal/georesource-delete-modal.module.js',
            'app/components/kommonitorAdmin/adminGeoresourcesManagement/georesourceDeleteModal/georesource-delete-modal.component.js',
            'app/components/kommonitorAdmin/adminMultiUseComponents/batchUpdateResultModal/batch-update-result-modal.module.js',
            'app/components/kommonitorAdmin/adminMultiUseComponents/batchUpdateResultModal/batch-update-result-modal.component.js',
            'app/components/kommonitorAdmin/adminMultiUseComponents/indicatorEditTimeseriesMapping/indicator-edit-timeseries-mapping.module.js',
            'app/components/kommonitorAdmin/adminMultiUseComponents/indicatorEditTimeseriesMapping/indicator-edit-timeseries-mapping.component.js', 
            'app/components/kommonitorAdmin/adminScriptManagement/admin-script-management.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/admin-script-management.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/generic/script-generic.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/generic/script-generic.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/sum/script-sum.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/sum/script-sum.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/subtract/script-subtract.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/subtract/script-subtract.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/percentage/script-percentage.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/percentage/script-percentage.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/promille/script-promille.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/promille/script-promille.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/share/script-share.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/share/script-share.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeAbsolute/script-change-absolute.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeAbsolute/script-change-absolute.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeAbsoluteRefDate/script-change-absolute-ref-date.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeAbsoluteRefDate/script-change-absolute-ref-date.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeRelativeRefDate/script-change-relative-ref-date.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeRelativeRefDate/script-change-relative-ref-date.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeRelative/script-change-relative.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/changeRelative/script-change-relative.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/trend/script-trend.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/trend/script-trend.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/continuity/script-continuity.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/continuity/script-continuity.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/division/script-division.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/division/script-division.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/headlineIndicator/script-headline-indicator.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/headlineIndicator/script-headline-indicator.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/multiplication/script-multiplication.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/multiplication/script-multiplication.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/pointsInPolygon/script-points-in-polygon.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/pointsInPolygon/script-points-in-polygon.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/georesourceStatistics/script-georesource-statistics.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/georesourceStatistics/script-georesource-statistics.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/georesourceSubsetShare/script-georesource-subset-share.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/georesourceSubsetShare/script-georesource-subset-share.component.js',            
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/script-add-modal.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptAddModal/script-add-modal.component.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptDeleteModal/script-delete-modal.module.js',
            'app/components/kommonitorAdmin/adminScriptManagement/scriptDeleteModal/script-delete-modal.component.js',
            'app/components/kommonitorAdmin/adminScriptExecution/admin-script-execution.module.js',
            'app/components/kommonitorAdmin/adminScriptExecution/admin-script-execution.component.js',
            'app/components/kommonitorAdmin/adminConfig/adminAppConfig/admin-app-config.module.js',
            'app/components/kommonitorAdmin/adminConfig/adminAppConfig/admin-app-config.component.js',
            'app/components/kommonitorAdmin/adminConfig/adminControlsConfig/admin-controls-config.module.js',
            'app/components/kommonitorAdmin/adminConfig/adminControlsConfig/admin-controls-config.component.js',
            'app/components/kommonitorAdmin/adminConfig/adminKeycloakConfig/admin-keycloak-config.module.js',
            'app/components/kommonitorAdmin/adminConfig/adminKeycloakConfig/admin-keycloak-config.component.js',
            'app/components/kommonitorAdmin/kommonitor-admin.module.js',
            'app/components/kommonitorAdmin/kommonitor-admin.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorIndividualIndicatorComputation/kommonitor-individual-indicator-computation.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorIndividualIndicatorComputation/kommonitor-individual-indicator-computation.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDiagrams/kommonitor-diagrams.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDiagrams/kommonitor-diagrams.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/indicatorRadar/indicator-radar.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/indicatorRadar/indicator-radar.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/regressionDiagram/regression-diagram.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/regressionDiagram/regression-diagram.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorFilter/kommonitor-filter.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorFilter/kommonitor-filter.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorBalance/kommonitor-balance.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorBalance/kommonitor-balance.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorLegend/kommonitor-legend.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorLegend/kommonitor-legend.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/poi/poi.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/poi/poi.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDataImport/kommonitor-data-import.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDataImport/kommonitor-data-import.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/poi/wmsModal/wms-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/poi/wmsModal/wms-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/poi/wfsModal/wfs-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/poi/wfsModal/wfs-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitorMap/kommonitor-map.module.js',
            'app/components/kommonitorUserInterface/kommonitorMap/kommonitor-map.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/infoModal/info-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/spatialUnitNotificationModal/spatial-unit-notification-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/spatialUnitNotificationModal/spatial-unit-notification-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/feedbackModal/feedback-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/feedbackModal/feedback-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingAddIndicatorModal/reporting-add-indicator-modal.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingAddIndicatorModal/reporting-add-indicator-modal.component.js',
            'app/components/kommonitorUserInterface/kommonitor-user-interface.module.js',
            'app/components/kommonitorUserInterface/kommonitor-user-interface.component.js',
            'app/app.js'
        ],
        kommonitor_styles: [
            'app/app.css'
        ],
        copy_files: [
            //the path prefix 'app/' will be set in the copy-command itself! Thus is omitted here.
            'dependencies/**/*',
            'kommonitor-script-resources/**/*',
            'iconsFromPngTree/**/*',
            'logos/**/*',
            'components/**/*.template.html',
            'config/**/*'           
        ],

        // babel: {
        //   options: {
        //     sourceMap: true
        //   },
        //   dist: {
        //     files: [{
        //       expand: true,
        //       cwd: './app',
        //       src: '{,**/}*.js',
        //       dest: '.tmp/scripts',
        //       ext: '.es5.js'
        //     }]
        //   }
        // },

        babel: {
          options: {
            sourceMap: true
          },
          dist: {
            files: {
              "dist/kommonitor-client.es5.js": "dist/kommonitor-client.js"
            }
          }
        },

        clean: ["dist/"],
        tags: {
            options: {
                scriptTemplate: '"{{ path }}",',
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
                src: ['<%= kommonitor_client %>'],
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
                src: ['<%= kommonitor_styles %>'],
                dest: 'app/index.html'
            }
        },
        concat: {
            // libs: {
            //     src: ['<%= lib_scripts %>'],
            //     dest: 'dist/js/deps.<%= name %>.min.js'
            // },
            kommonitor: {
                src: '<%= kommonitor_client %>',
                dest: 'dist/kommonitor-client.js'
            },
            styles: {
                src: '<%= kommonitor_styles %>',
                dest: 'dist/<%= name %>.css'
            },
            // libStyles: {
            //     src: '<%= lib_styles %>',
            //     dest: 'dist/css/deps.<%= name %>.css'
            // }
        },
        uglify: {
            options: {
                banner: '/*! <%= name %> <%= grunt.template.today("yyyy-mm-dd HH:MM") %> */\n'
            },
            appJs: {
                files: {
                    'dist/kommonitor-client.min.js': ['dist/kommonitor-client.es5.js']
                }
            }
        },
        cssmin: {
            options: {
            },
            styles: {
                files: {
                    'dist/<%= name %>.min.css': ['<%= concat.styles.dest %>']
                }
            },
            // depStyles: {
            //     files: {
            //         'dist/css/deps.<%= name %>.min.css': ['<%= concat.libStyles.dest %>']
            //     }
            // }
        },
        copy: {
            locals: {
                files: [
                    {expand: true, flatten: false, cwd: 'app/', src: '<%= copy_files %>', dest: 'dist/'},
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
      //   watch: {
      //       less: {
      //           files: [ 'bower.json' ],
      //           tasks: [ 'exec:bower_install' ]
			// },
			// hint: {
			// 	files: ['<%= jshint.files %>'],
			// 	tasks: ['jshint']
			// }
      //   },
		// exec: {
		// 	bower_install: {
    //             cmd: "bower install"
		// 	}
		// },
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

    // grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
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
    grunt.loadNpmTasks('grunt-babel');

    grunt.registerTask('test', ['jshint']);
    // grunt.registerTask('copy-all', ['copy:locals', 'copy:css', 'copy:fonts']);
    // grunt.registerTask('copy-css', ['copy:css']);
    // grunt.registerTask('copy-fonts', ['copy:fonts']);
    grunt.registerTask('env-build', ['tags']);
    grunt.registerTask('default', ['clean', 'concat', 'babel', 'uglify', 'cssmin', 'copy', 'processhtml']);
	// grunt.registerTask('buildDebugScript', ['clean', 'concat']);

	grunt.registerTask('buildWar', ['default', 'war']);
//  grunt.registerTask('buildWar', ['test', 'default', 'war']);
};
