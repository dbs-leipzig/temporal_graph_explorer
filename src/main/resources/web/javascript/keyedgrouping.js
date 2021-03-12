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

/**---------------------------------------------------------------------------------------------------------------------
 * Global Values
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Minimum and maximum value for a given property
 */
let minMaxPropValue = { vertex : { }, edge : { } };

/**
 * Maximum value for the count attribute of edges
 * @type {number}
 */
let maxEdgeCount = 0;

/**
 * Indicates whether the leaflet map layout is currently in usage.
 * @type {boolean}
 */
let isLeafletLayoutInUsage = false;

let isEChartsInUsage = true;

/**---------------------------------------------------------------------------------------------------------------------
 * Callbacks
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Reload the database properties whenever the database selection is changed
 */
$(document).on("change", "#databaseName", loadDatabaseProperties);

/**
 * When the 'Show whole graph' button is clicked, send a request to the server for the whole graph
 */
$(document).on("click",'#showWholeGraph', function(e) {
    e.preventDefault();
    let btn = $(this);
    btn.addClass("loading");
    let databaseName = getSelectedDatabase();
    $.post('http://localhost:2342/graph/' + databaseName, function(data) {
        updateAdaptiveSizeSelects(data['node_keys'], data['edge_keys']);
        drawGraph(data, true);
        btn.removeClass("loading");
    }, "json");
});

/**
 * When the 'Execute' button is clicked, construct a request and send it to the server
 */
$(document).on('click', ".execute-button", function () {
    let btn = $(this);
    btn.addClass("loading");
    let reqData = {
        dbName: getSelectedDatabase(),
        keyFunctions: getKeyFunctions(),
        aggFunctions: getAggFunctions(),
        vertexFilters: getValues("#vertexFilters"),
        edgeFilters: getValues("#edgeFilters"),
        filterAllEdges: getValues("#edgeFilters") === ["none"]
    };

    $.ajax({
        url: 'http://localhost:2342/keyedgrouping/',
        datatype: "text",
        type: "post",
        contentType: "application/json",
        data: JSON.stringify(reqData),
        success: function(data) {
            updateAdaptiveSizeSelects(data['node_keys'], data['edge_keys']);
            drawGraph(data, true);
            btn.removeClass('loading');
        }
    });
});

$(document).on('click', ".add-key-button", addKeyFunctionCallback);

$(document).on('click', ".add-agg-button", addAggFunctionCallback);

$(document).on('click', ".del-key-button", function (event) {
    let btn = $(this);
    btn.parent('.input-grouping-key').detach();
    // Prevent default submitting
    event.preventDefault();
});

$(document).on('click', ".del-agg-button", function (event) {
    let btn = $(this);
    btn.parent('.input-aggregate-func').detach();
    // Prevent default submitting
    event.preventDefault();
});

/**
 * If the select of a grouping key changes, then replace the arguments body with the corresponding one
 */
$(document).on('change', '.grouping-key-select', function () {
    let select = $(this);
    let selectedValue = select.val();
    let bodiesCollection = select.parent().children('.key-form-bodies');
    bodiesCollection.children().addClass('hide');
    bodiesCollection.children('.body-' + selectedValue).removeClass('hide');
});

/**
 * Register a callback for changing a element type in a key function.
 */
$(document).on('change', 'select[name="type"]', function () {
    let select = $(this);
    let selectedValue = select.val(); // vertex or edge
    let bodiesCollection = select.parent().children('.form-bodies');
    // First hide all property selections
    bodiesCollection.find('.prop-select').addClass('hide');
    // Enable vertex or edge properties
    bodiesCollection.find('.prop-select[name=' + selectedValue + 'Prop]')
        .removeClass('hide');

    // First hide all label selections
    bodiesCollection.find('.label-spec-select').addClass('hide');
    // Enable vertex or edge labels
    bodiesCollection.find('.label-spec-select[name=' + selectedValue +'LabelSpec]')
        .removeClass('hide');
});

$(document).on('change', '.grouping-agg-select', function () {
    let select = $(this);
    let selectedType = select.find('option:selected').attr('type');
    let bodiesCollection = select.parent().children('.agg-form-bodies');
    bodiesCollection.children().addClass('hide');
    bodiesCollection.children('.body-' + selectedType).removeClass('hide');
});

/**
 * Runs when the DOM is ready
 */
$(document).ready(function () {
    loadDatabases();
    loadDatabaseProperties();
    $('#vertexFilters').select2();
    $('#edgeFilters').select2();
    // Add first entry of key function and aggregate function
    addKeyFunctionCallback(null);
    let secondKeyEntry = addKeyFunctionCallback(null);
    secondKeyEntry.find('select[name="type"]').val('edge');
    addAggFunctionCallback(null);
    let secondAggEntry = addAggFunctionCallback(null);
    secondAggEntry.find('select[name="type"]').val('edge');
    buildECharts();
});

/**
 * Whenever one of the view options is changed, redraw the graph
 */
$(document).on("change", '.redraw', function() {
    if (bufferedData) {
        drawGraph(bufferedData, false);
    }
});

/**---------------------------------------------------------------------------------------------------------------------
 * Graph Drawing
 *-------------------------------------------------------------------------------------------------------------------*/

function drawGraph(data, initial = true) {
    if (data.type === 'spatialGraph') {
        if (isEChartsInUsage) {
            // purrfect
        } else {
            destroyCytoscape();
            buildECharts();
        }
        drawEChartsGraph(data, initial);
    } else {
        if (isEChartsInUsage) {
            destroyECharts();
            buildCytoscape();
        } else {
            // purrfect
        }
        drawCytoscapeGraph(data, initial);
    }
}

function destroyCytoscape() {
    cytoscapeInstance.destroy();
}

function destroyECharts() {
    eChartInstance.clear();
    eChartInstance.dispose();
    eChartInstance = null;
    let canvasParent = $('#canvas').parent();
    canvasParent.html('<div id="canvas"></div>');
}

/**
 * function called when the server returns the data
 * @param data graph data
 * @param initial indicates whether the data is drawn initially
 */
function drawEChartsGraph(data, initial = true) {
    // lists of vertices and edges
    let nodes = data.nodes;
    let edges = data.edges;

    if(initial) {
        // buffer the data to speed up redrawing
        bufferedData = data;

        // Calculate min and max values for all numerical properties
        nodes.forEach((node) => {
            data['node_keys'].forEach(function (key) {
                let value = Number(node.value[2]['properties'][key]);
                if (value) {
                    if (minMaxPropValue.vertex[key]) {
                        if (value < minMaxPropValue.vertex[key].min) {
                            minMaxPropValue.vertex[key].min = value;
                        }
                        if (value > minMaxPropValue.vertex[key].max) {
                            minMaxPropValue.vertex[key].max = value;
                        }
                    } else {
                        minMaxPropValue.vertex[key] = {min: value, max: value};
                    }
                }
            });
        });

        // Calculate min and max values for all numerical properties
        edges.forEach((edge) => {
            data['edge_keys'].forEach(function (key) {
                let value = Number(edge.value[2]['properties'][key]);
                if (value) {
                    if (minMaxPropValue.edge[key]) {
                        if (value < minMaxPropValue.edge[key].min) {
                            minMaxPropValue.edge[key].min = value;
                        }
                        if (value > minMaxPropValue.edge[key].max) {
                            minMaxPropValue.edge[key].max = value;
                        }
                    } else {
                        minMaxPropValue.edge[key] = { min : value, max : value};
                    }
                }
            });
        });
    }

    let selectedVertexKey = $('#vertexPropertyAdaptiveSelect').val();
    let selectedEdgeKey = $('#edgePropertyAdaptiveSelect').val();

    nodes.forEach((eChartNode) => {
        if (selectedVertexKey !== '_default' && eChartNode.value[2]['properties'][selectedVertexKey]) {
            let propValue = eChartNode.value[2]['properties'][selectedVertexKey];
            if (propValue !== null) {
                let minValue = minMaxPropValue.vertex[selectedVertexKey].min;
                let maxValue = minMaxPropValue.vertex[selectedVertexKey].max;

                if (maxValue !== minValue) {
                    eChartNode['symbolSize'] = getAdaptiveValue(minValue, maxValue, 8, 38, propValue);
                }
            }
        } else {
            eChartNode['symbolSize'] = 8;
        }
    });

    edges.forEach((eChartEdge) => {
        if (selectedEdgeKey !== '_default' && eChartEdge.value[2]['properties'][selectedEdgeKey]) {
            let propValue = eChartEdge.value[2]['properties'][selectedEdgeKey];
            if (propValue !== null) {
                let minValue = minMaxPropValue.edge[selectedEdgeKey].min;
                let maxValue = minMaxPropValue.edge[selectedEdgeKey].max;

                if (maxValue !== minValue) {
                    eChartEdge['lineStyle']['width'] = getAdaptiveValue(minValue, maxValue, 5, 30, propValue);
                }
            }
        } else {
            eChartEdge['lineStyle']['width'] = 5;
        }
    });


    if (data.type === 'spatialGraph') {
        if (isLeafletLayoutInUsage) {
            // purrfect
        } else {
            eChartsOption = getEChartsOptions(true);
            isLeafletLayoutInUsage = true;
            eChartInstance.clear();
        }
    } else {
        if (isLeafletLayoutInUsage) {
            eChartsOption = getEChartsOptions(false);
            isLeafletLayoutInUsage = false;
            if (eChartInstance.getModel().getComponent('leaflet')) {
                let leafletMapInstance = eChartInstance.getModel().getComponent('leaflet').getLeaflet();
                leafletMapInstance.remove();
            }
            let canvasParent = $('#canvas').parent();
            canvasParent.html('<div id="canvas"></div>');
            eChartInstance = echarts.init(document.getElementById('canvas'));
        } else {
            //purrfect
        }
    }

    eChartsOption.series[0].data = nodes;
    eChartsOption.series[0].links = edges;

    if (eChartsOption && typeof eChartsOption === "object") {
        eChartInstance.setOption(eChartsOption, true);
    }
}

function drawCytoscapeGraph(data, initial = true) {
    if(initial) {
        // buffer the data to speed up redrawing
        bufferedData = data;
    }
    // lists of vertices and edges
    let nodes = data.nodes;
    let edges = data.edges;

    if(initial) {
        // buffer the data to speed up redrawing
        bufferedData = data;
    }
    // lists of vertices and edges
    nodes = nodes.map((eChartNode, index) => {
        let id = eChartNode.name;
        let valueElement = eChartNode.value[2];
        let label = valueElement.label;
        let properties = valueElement.properties;
        let color = eChartNode.itemStyle.color;

        data['node_keys'].forEach(function (key) {
            let value = Number(properties[key]);
            if (value) {
                if (minMaxPropValue.vertex[key]) {
                    if (value < minMaxPropValue.vertex[key].min) {
                        minMaxPropValue.vertex[key].min = value;
                    }
                    if (value > minMaxPropValue.vertex[key].max) {
                        minMaxPropValue.vertex[key].max = value;
                    }
                } else {
                    minMaxPropValue.vertex[key] = { min : value, max : value};
                }
            }
        });

        return {
            data: {
                id: id,
                label : label,
                properties : properties,
                color : color,
                tx_from : valueElement['tx_from'],
                tx_to : valueElement['tx_to'],
                val_from : valueElement['val_from'],
                val_to : valueElement['val_to'],
            }
        };
    });
    edges = edges.map((eChartEdge, index) => {
        let id = eChartEdge.name;
        let valueElement = eChartEdge.value[2];
        let label = valueElement.label;
        let properties = valueElement.properties;
        let color = eChartEdge.lineStyle.color;

        data['edge_keys'].forEach(function (key) {
            let value = Number(properties[key]);
            if (value) {
                if (minMaxPropValue.edge[key]) {
                    if (value < minMaxPropValue.edge[key].min) {
                        minMaxPropValue.edge[key].min = value;
                    }
                    if (value > minMaxPropValue.edge[key].max) {
                        minMaxPropValue.edge[key].max = value;
                    }
                } else {
                    minMaxPropValue.edge[key] = { min : value, max : value};
                }
            }
        });

        return {
            data: {
                id: id,
                source : eChartEdge.source,
                target : eChartEdge.target,
                label : label,
                properties : properties,
                color : color,
                tx_from : valueElement['tx_from'],
                tx_to : valueElement['tx_to'],
                val_from : valueElement['val_from'],
                val_to : valueElement['val_to'],
            }
        };
    });

    cytoscapeInstance.elements().remove();
    cytoscapeInstance.add(nodes);
    cytoscapeInstance.add(edges);

    let layout = cytoscapeInstance.layout(
        {
            name: 'cose',
            refresh: 4,
            fit: true,
            padding: 30,
            nodeRepulsion: 8000000,
            nodeOverlap: 10,
            idealEdgeLength: 1,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 100,
            numIter: 50,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0,
        });
    layout.run()
}

/**---------------------------------------------------------------------------------------------------------------------
 * UI Initialization
 *-------------------------------------------------------------------------------------------------------------------*/

/**
 * Initialize the database menu according to the selected database
 */
function loadDatabaseProperties() {
    let databaseName = $('#databaseName').val();
    $.post('http://localhost:2342/keys/' + databaseName, function(response) {
        initializeFilterKeyMenus(response);
        initializeLabelSpecSelects(response);
        initializePropertyKeyMenus(response);
    }, "json");
}

function addAggFunctionCallback(event) {
    let btn = $(this);
    let list = $('#agg-function-list');
    let template = $('#template-agg-form');

    let newForm = template.clone();
    /** Reset template to default **/
    newForm.removeAttr('id');
    newForm.removeClass('hide');

    newForm.appendTo(list);

    // Prevent default submitting
    if (event != null) {
        event.preventDefault();
    }
    return newForm;
}

function addKeyFunctionCallback(event) {
    let btn = $(this);
    let list = $('#key-function-list');
    let template = $('#template-key-form');

    let newForm = template.clone();
    /** Reset template to default **/
    newForm.removeAttr('id');
    newForm.removeClass('hide');

    newForm.appendTo(list);

    // Prevent default submitting
    if (event != null) {
        event.preventDefault();
    }
    return newForm;
}

/**
 * Initialize the filter menus with the labels
 * @param keys labels of the input vertices
 */
function initializeFilterKeyMenus(keys) {
    let vertexFilters = $('#vertexFilters');
    let edgeFilters = $('#edgeFilters');

    // clear previous entries
    vertexFilters.html("");
    edgeFilters.html("");


    // add one entry per vertex label
    keys.vertexLabels.forEach(label => {
        vertexFilters.append($("<option value='" + label + "'>" + label + "</option>"))
    });

    keys.edgeLabels.forEach(label => {
        edgeFilters.append($("<option value='" + label + "'>" + label + "</option>"))
    });
    edgeFilters.append($("<option value='none'>None</option>"))
}

/**
 * Initialize the dropdown selects of key functions offering a label specific feature.
 *
 * @param keys
 */
function initializeLabelSpecSelects(keys) {
    let vertexLabelSelect = $('select[name="vertexLabelSpec"]');
    let edgeLabelSelect = $('select[name="edgeLabelSpec"]');
    let defaultOption = '<option value="no">Label specific? (No)</option>';

    // clear previous entries
    vertexLabelSelect.html("");
    edgeLabelSelect.html("");

    vertexLabelSelect.append($(defaultOption))
    edgeLabelSelect.append($(defaultOption))

    // add one entry per vertex label
    keys.vertexLabels.forEach(label => {
        vertexLabelSelect.append($("<option value='" + label + "'>" + label + "</option>"))
    });

    keys.edgeLabels.forEach(label => {
        edgeLabelSelect.append($("<option value='" + label + "'>" + label + "</option>"))
    });
}

/**
 * Initialize the key propertyKeys menus.
 * @param keys array of vertex and edge keys
 */
function initializePropertyKeyMenus(keys) {
    let vertexPropSelect = $('select[name="vertexProp"]');
    let edgePropSelect = $('select[name="edgeProp"]');

    // clear previous entries
    vertexPropSelect.html("");
    edgePropSelect.html("");

    // add one entry per property key
    keys.vertexKeys.forEach(key => {
        vertexPropSelect.append($("<option value='" + key.name + "'>" + key.name + "</option>"))
    });

    keys.edgeKeys.forEach(key => {
        edgePropSelect.append($("<option value='" + key.name + "'>" + key.name + "</option>"))
    });
}

/**---------------------------------------------------------------------------------------------------------------------
 * Utility Functions
 *-------------------------------------------------------------------------------------------------------------------*/

function getKeyFunctions() {
    let returnFunctions = [];
    let keyFunctionElements = $('#key-function-list').children('.input-grouping-key').not('#template-key-form');

    for (let i = 0; i < keyFunctionElements.length ; i++) {
        let element = $(keyFunctionElements[i]);
        let type = element.find('select[name="type"]').val();
        let argBody = element.find('.key-form-bodies').find('.input-group').not('.hide');
        returnFunctions[i] = {};
        returnFunctions[i]['key'] = element.find('select[name="keyFunction"]').val();
        returnFunctions[i]['type'] = type;
        returnFunctions[i]['labelspec'] = argBody.find('select[name="' + type + 'LabelSpec"]').val();
        returnFunctions[i]['prop'] = argBody.find('select[name="' + type + 'Prop"]').val();
        returnFunctions[i]['dimension'] = argBody.find('select[name="dimension"]').val();
        returnFunctions[i]['periodBound'] = argBody.find('select[name="periodBound"]').val();
        returnFunctions[i]['field'] = argBody.find('select[name="field"]').val();
        returnFunctions[i]['unit'] = argBody.find('select[name="unit"]').val();
    }
    return returnFunctions;
}

function getAggFunctions() {
    let returnFunctions = [];
    let keyFunctionElements = $('#agg-function-list').children('.input-aggregate-func').not('#template-agg-form');

    for (let i = 0; i < keyFunctionElements.length ; i++) {
        let element = $(keyFunctionElements[i]);
        let type = element.find('select[name="type"]').val();
        let argBody = element.find('.agg-form-bodies').find('.input-group').not('.hide');
        returnFunctions[i] = {};
        returnFunctions[i]['agg'] = element.find('select[name="aggFunction"]').val();
        returnFunctions[i]['type'] = type;
        returnFunctions[i]['prop'] = argBody.find('select[name="' + type + 'Prop"]').val();
        returnFunctions[i]['dimension'] = argBody.find('select[name="dimension"]').val();
        returnFunctions[i]['periodBound'] = argBody.find('select[name="periodBound"]').val();
        returnFunctions[i]['unit'] = argBody.find('select[name="unit"]').val();
    }
    return returnFunctions;
}

/**
 * Updates the two selects for choosing a property to use for the adaptive size
 *
 * @param vertexKeys an array of numerical vertex property keys
 * @param edgeKeys and array of numerical edge property keys
 */
function updateAdaptiveSizeSelects(vertexKeys, edgeKeys) {
    let vertexKeySelect = $('#vertexPropertyAdaptiveSelect');
    let edgeKeySelect = $('#edgePropertyAdaptiveSelect');

    // clear previous entries
    vertexKeySelect.html("");
    edgeKeySelect.html("");

    vertexKeySelect.append($('<option value="_default">default</option>'));
    edgeKeySelect.append($('<option value="_default">default</option>'));

    // add one entry per property key
    vertexKeys.forEach(key => {
        vertexKeySelect.append($("<option value='" + key + "'>" + key + "</option>"));
    });

    edgeKeys.forEach(key => {
        edgeKeySelect.append($("<option value='" + key + "'>" + key + "</option>"));
    });
}