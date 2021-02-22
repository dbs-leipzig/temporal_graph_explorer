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
 * True, if the graph layout should be force based
 * @type {boolean}
 */
let useForceLayout = true;

/**
 * True, if the default label should be used
 * @type {boolean}
 */
let useDefaultLabel = true;

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
        useDefaultLabel = true;
        useForceLayout = false;
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
        //edgeKeys: getValues("#edgePropertyKeys"),
        //vertexAggrFuncs: getValues("#vertexAggrFuncs"),
        //edgeAggrFuncs: getValues("#edgeAggrFuncs"),
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
            useDefaultLabel = false;
            useForceLayout = true;
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
    cy = buildCytoscape();
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
});

/**---------------------------------------------------------------------------------------------------------------------
 * Graph Drawing
 *-------------------------------------------------------------------------------------------------------------------*/
function buildCytoscape() {
    return cytoscape({
        container: document.getElementById('canvas'),
        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                // define label content and font
                'content': function (node) {

                    let labelString = getLabel(node, getVertexLabelKey(), useDefaultLabel);

                    let properties = node.data('properties');

                    if (properties['count'] != null) {
                        labelString += ' (' + properties['count'] + ')';
                    }
                    return labelString;
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count != null) {
                            count = count / maxVertexCount;
                            // surface of vertices is proportional to count
                            return Math.max(2, Math.sqrt(count * 10000 / Math.PI));
                        }
                    }
                    return 10;
                },
                'text-valign': 'center',
                'color': 'black',
                // this function changes the text color according to the background color
                // unnecessary atm because only light colors can be generated
                /* function (vertices) {
                 let label = getLabel(vertices, vertexLabelKey, useDefaultLabel);
                 let bgColor = colorMap[label];
                 if (bgColor[0] + bgColor[1] + (bgColor[2] * 0.7) < 300) {
                 return 'white';
                 }
                 return 'black';
                 },*/
                // set background color according to color map
                'background-color': function (node) {
                    let label = getLabel(node, getVertexLabelKey(), useDefaultLabel);
                    let color = colorMap[label];
                    let result = '#';
                    result += ('0' + color[0].toString(16)).substr(-2);
                    result += ('0' + color[1].toString(16)).substr(-2);
                    result += ('0' + color[2].toString(16)).substr(-2);
                    return result;
                },

                /* size of vertices can be determined by property count
                 count specifies that the vertex stands for
                 1 or more other vertices */
                'width': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxVertexCount;
                            // surface of vertex is proportional to count
                            return Math.sqrt(count * 1000000 / Math.PI) + 'px';
                        }
                    }
                    return '60px';

                },
                'height': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxVertexCount;
                            // surface of vertex is proportional to count
                            return Math.sqrt(count * 1000000 / Math.PI) + 'px';
                        }
                    }
                    return '60px';
                },
                'text-wrap': 'wrap'
            })
            .selector('edge')
            .css({
                'curve-style': 'bezier',
                // layout of edge and edge label
                'content': function (edge) {

                    if (!$('#showEdgeLabels').is(':checked')) {
                        return '';
                    }
                    let labelString = '';
                    labelString = getLabel(edge, getEdgeLabelKey(), useDefaultLabel);

                    let properties = edge.data('properties');

                    if (properties['count'] !== null) {
                        labelString += ' (' + properties['count'] + ')';
                    }

                    return labelString;
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (edge) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = edge.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxVertexCount;
                            // surface of vertices is proportional to count
                            return Math.max(2, Math.sqrt(count * 10000 / Math.PI));
                        }
                    }
                    return 10;
                },
                'line-color': '#999',
                // width of edges can be determined by property count
                // count specifies that the edge represents 1 or more other edges
                'width': function (edge) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = edge.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxEdgeCount;
                            return Math.sqrt(count * 1000);
                        }
                    }
                    return 2;
                },
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#000'
            })
            // properties of edges and vertices in special states, e.g. invisible or faded
            .selector('.faded')
            .css({
                'opacity': 0.25,
                'text-opacity': 0
            })
            .selector('.invisible')
            .css({
                'opacity': 0,
                'text-opacity': 0
            }),
        ready: cytoReady
    });
}

/**
 * function called when the server returns the data
 * @param data graph data
 * @param initial indicates whether the data is drawn initially
 */
function drawGraph(data, initial = true) {
    // lists of vertices and edges
    let nodes = data.nodes;
    let edges = data.edges;

    if(initial) {
        // buffer the data to speed up redrawing
        bufferedData = data;

        // compute maximum count of all vertices, used for scaling the vertex sizes
        maxVertexCount = nodes.reduce((acc, node) => {
            return Math.max(acc, Number(node['data']['properties']['count']))
        }, 0);

        let labels = new Set(nodes.map((node) => {
            return (!useDefaultLabel && getVertexLabelKey() !== 'label') ?
                node['data']['properties'][getVertexLabelKey()] : node['data']['label']
        }));

        // generate random colors for the vertex labels
        generateRandomColors(labels);

        // compute maximum count of all edges, used for scaling the edge sizes
        maxEdgeCount = edges.reduce((acc, edge) => {
            return Math.max(acc, Number(edge['data']['properties']['count']))
        }, 0);
    }

    cy.elements().remove();
    cy.add(nodes);
    cy.add(edges);

    if ($('#hideNullGroups').is(':checked')) {
        hideNullGroups();
    }

    if ($('#hideDisconnected').is(':checked')) {
        hideDisconnected();
    }

    let layout = cy.layout(getLayoutConfig(useForceLayout));
    layout.run()
}




/**
 * Hide all vertices and edges, that have a NULL property.
 */
function hideNullGroups() {
    let vertexKeys = getValues("#vertexPropertyKeys");
    let edgeKeys = getValues("#edgePropertyKeys");

    let nodes = [];
    for(let i = 0; i < cy.nodes().length; i++) {
        nodes[i] = cy.nodes()[i]
    }

    let edges = [];
    for(let i = 0; i < cy.edges().length; i++) {
        edges[i] = cy.edges()[i];
    }

    nodes
        .filter(node => vertexKeys.find((key) => node.data().properties[key] === "NULL"))
        .forEach(node => node.remove());

    edges
        .filter(edge => edgeKeys.find((key) => edge.data().properties[key] === "NULL"))
        .forEach(edge => edge.remove());
}

/**
 * Function to hide all disconnected vertices (vertices without edges).
 */
function hideDisconnected() {
    let nodes = [];
    for(let i = 0; i < cy.nodes().length; i++) {
        nodes[i] = cy.nodes()[i]
    }

    nodes.filter(node => {
        return (cy.edges('[source="' + node.id() + '"]').length === 0)
            && (cy.edges('[target="' + node.id() + '"]').length === 0)
    }).forEach(node => node.remove());
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
        returnFunctions[i]['labelspec'] = argBody.find('select[name="' + type + 'labelSpec"]').val();
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
    }
    return returnFunctions;
}