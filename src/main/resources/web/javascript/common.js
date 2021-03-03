/*
 * Copyright © 2014 - 2021 Leipzig University (Database Research Group)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**------------------
 * Global Values
 *-------------------*/

/**
 * Buffers the last graph response from the server to improve redrawing speed.
 */
let bufferedData;

let leafletCenter = [-73.9559308, 40.7747878];

let eChartInstance;

let eChartsOption = {};

/**----------------
 * Callbacks
 *------------------*/

/**
 * Whenever one of the view options is changed, redraw the graph
 */
$(document).on("change", '.redraw', function() {
    drawGraph(bufferedData, false);
});

/**---------------------
 * Utility Functions
 *-----------------------*/

/**
 * Get the selected database
 *
 * @returns selected database name
 */
function getSelectedDatabase() {
    return $('#databaseName').val();
}

/**
 * Retrieve the values of the specified element as Array
 *
 * @param element the html element
 * @returns {Array}
 */
function getValues(element) {
    return $(element).val() || []
}

/**
 * Builds the eCharts environment.
 */
function buildECharts() {
    eChartInstance = echarts.init(document.getElementById('canvas'));

    eChartsOption = getEChartsOptions(false);

    if (eChartsOption && typeof eChartsOption === "object") {
        eChartInstance.setOption(eChartsOption);
    }
}

/**
 * Returns the eCharts option. If parameter {@code useLeaflet} is set to true, a configuration with
 * enabled Map-View using Leaflet is returned.
 *
 * @param useLeaflet the flag to activate the Map-View
 * @returns the eCharts configuration as object
 */
function getEChartsOptions(useLeaflet) {
    let options = {
        tooltip: {
            trigger: 'item',
            triggerOn : 'click',
        },
        series: [
            {
                name: 'Temporal Graph Explorer',
                type: 'graph',
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [4, 10],
                edgeLabel: {
                    fontSize: 20,
                },
                selectedMode : 'single',
                lineStyle: {
                    width: 3,
                },
                data: [],
                links: [],
                roam: true,
                label: {
                    show: true,
                    position: "right",
                    formatter: function (params) {
                        if (params.value[2]['properties']['name']) {
                            return params.value[2]['properties']['name'];
                        } else {
                            return params.value[2]['label'];
                        }
                    },
                },
                tooltip : {
                    formatter: function (params) {
                        let content = document.createElement('div');
                        let text = '';
                        let label = params.value[2]['label'];

                        if (label != null) {
                            text += '<b>' + label + '</b><br>';
                        }
                        for (let [key, value] of Object.entries(params.value[2]['properties'])) {
                            if (key === 'id' || key === 'source' || key === 'target'){
                                // don't print
                            } else {
                                text += key + ' : ' + value + '<br>';
                            }
                        }
                        text += '<br>'
                        text += '<i>TPGM temporal attributes</i><br>'
                        text += 'tx_from : ' + params.value[2]['tx_from'] + '<br>';
                        text += 'tx_to : ' + params.value[2]['tx_to'] + '<br>';
                        text += 'val_from : ' + params.value[2]['val_from'] + '<br>';
                        text += 'val_to : ' + params.value[2]['val_to'] + '<br>';

                        content.innerHTML = text;
                        return content;
                    }
                },
                labelLayout: {
                    hideOverlap: true,
                },
                autoCurveness : 30,
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 10
                    }
                }
            },
        ],
    };

    if (useLeaflet) {
        options.leaflet = {
            title: {
                text: "Graph Demo",
                subtext: "Test graph on maps",
                left: "center",
            },
            center: leafletCenter,
            zoom: 12,
            roam: true,
            tiles: [
                {
                    label: "OpenStreetMap",
                    urlTemplate:
                        "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                    options: {
                        attribution:
                            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
                    },
                },
            ],
        };

        options.series[0].coordinateSystem = "leaflet";
    } else {
        options.series[0].layout = "force";
        options.series[0].force = {
            // initLayout: 'circular'
            // gravity: 0
            repulsion: 60,
        };

    }
    return options;
}

function loadDatabases() {
    $.get('http://localhost:2342/graphs', function(response) {
        let options = '';
        for (i = 0; i < response.length ; i++) {
            options += '<option value="' + response[i] + '">' + response[i] + '</option>';
        }
        $('#databaseName').html(options);
    }, "json");
}
