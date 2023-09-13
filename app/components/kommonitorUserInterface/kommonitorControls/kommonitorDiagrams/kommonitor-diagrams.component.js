import { __decorate } from "tslib";
import { Component } from '@angular/core';
import * as echarts from 'echarts'; // Import echarts library
export let KommonitorDiagramsComponent = class KommonitorDiagramsComponent {
    constructor() { }
    ngOnInit() {
        var chartDom = document.getElementById('main-diag');
        var myChart = echarts.init(chartDom);
        var option;
        option = {
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    data: [150, 230, 224, 218, 135, 147, 260],
                    type: 'line'
                }
            ]
        };
        option && myChart.setOption(option);
    }
};
KommonitorDiagramsComponent = __decorate([
    Component({
        selector: 'kommonitor-diagrams',
        templateUrl: 'kommonitor-diagrams.template.html', // Replace with your actual HTML file path
        // Replace with your actual CSS file path
    })
], KommonitorDiagramsComponent);
//# sourceMappingURL=kommonitor-diagrams.component.js.map