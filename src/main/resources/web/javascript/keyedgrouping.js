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
 * Maximum value for the count attribute of vertices
 * @type {number}
 */
let maxVertexCount = 0;

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
 * Make sure that only one vertex/edge aggregate is checked for adaptive lement size.
 */
$(document).on('change', 'input[name="useForAdaptiveSize"]', function () {
    let theSwitch = $(this);
    if (theSwitch.is(':checked')) {
        // check if the switch belongs to a vertex or edge
        let thisTypeSelect = theSwitch.parents('.input-aggregate-func').find('select[name="type"]');
        let aggType = thisTypeSelect.val();
        //find all other switches and deactivate them
        $('.input-aggregate-func').each(function( index ) {
            let typeSelect = $( this ).find('select[name="type"]');
            if (typeSelect.val() === aggType && typeSelect.get(0) !== thisTypeSelect.get(0)) {
                $( this ).find('input[name="useForAdaptiveSize"]').prop( "checked", false );
            }
        });
    }
})

/**
 * When the 'Show whole graph' button is clicked, send a request to the server for the whole graph
 */
$(document).on("click",'#showWholeGraph', function(e) {
    e.preventDefault();
    let btn = $(this);
    btn.addClass("loading");
    let databaseName = getSelectedDatabase();
    $.post('http://localhost:2342/graph/' + databaseName, function(data) {
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

        // compute maximum count of all vertices, used for scaling the vertex sizes
        maxVertexCount = nodes.reduce((acc, node) => {
            return Math.max(acc, Number(node.value[2]['properties']['count']))
        }, 0);

        // compute maximum count of all edges, used for scaling the edge sizes
        maxEdgeCount = edges.reduce((acc, edge) => {
            return Math.max(acc, Number(edge.value[2]['properties']['count']))
        }, 0);
    }

    if (data.type === 'spatialGraph') {
        if (isLeafletLayoutInUsage) {
            // purrfect
        } else {
            eChartsOption = getEChartsOptions(true);
            isLeafletLayoutInUsage = true;
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
    let nodes = data.nodes.map((eChartNode, index) => {
        let id = eChartNode.name;
        let valueElement = eChartNode.value[2];
        let label = valueElement.label;
        let properties = valueElement.properties;
        let color = eChartNode.itemStyle.color;

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
    let edges = data.edges.map((eChartEdge, index) => {
        let id = eChartEdge.name;
        let valueElement = eChartEdge.value[2];
        let label = valueElement.label;
        let properties = valueElement.properties;
        let color = eChartEdge.lineStyle.color;

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
        returnFunctions[i]['useForAdaptiveSize'] = element.find('input[name="useForAdaptiveSize"]')
            .is(':checked');
    }
    return returnFunctions;
}