module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        name: 'kommonitor-client',
        context_name: '<%= name %>##<%= pkg.version %>-<%= grunt.template.today("yyyymmddHHMM")%>',
        kommonitor_client: [
            'app/util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDataSetup/kommonitor-data-setup.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorDataSetup/kommonitor-data-setup.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/measureOfValueClassification/measure-of-value-classification.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/measureOfValueClassification/measure-of-value-classification.component.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorAdmin/kommonitor-admin.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorAdmin/kommonitor-admin.component.js',
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
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.module.js',
            'app/components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.component.js',
            'app/components/kommonitorUserInterface/kommonitorMap/kommonitor-map.module.js',
            'app/components/kommonitorUserInterface/kommonitorMap/kommonitor-map.component.js',
            'app/components/kommonitorUserInterface/kommonitor-user-interface.module.js',
            'app/components/kommonitorUserInterface/kommonitor-user-interface.component.js',
            'app/env.js',
            'app/app.js'
        ],
        kommonitor_styles: [
            'app/app.css'
        ],
        copy_files: [
            //the path prefix 'app/' will be set in the copy-command itself! Thus is omitted here.
            'dependencies/**/*',
            'iconsFromPngTree/**/*',
            'logos/**/*',
			      'components/**/*.template.html'
        ],
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
                dest: 'dist/js/kommonitor-client.js'
            },
            styles: {
                src: '<%= kommonitor_styles %>',
                dest: 'dist/css/<%= name %>.css'
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
                    'dist/js/kommonitor-client.min.js': ['<%= concat.kommonitor.dest %>']
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
