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

var base_dc = 0.03; //TODO: derive a formula
var lon_ext = 1;  //extent in lng
var lonmin = -74; //90
var latmin = 40.6; //0
var lon_cor = lon_ext*base_dc;
var lat_ext = lon_ext; //extent in lat
var lonmax = lonmin + lon_ext;
var lonmid = (lonmin+lonmax)/2;
var lonmax2 = lonmax + lon_cor;
var latmax = latmin + lat_ext;
var latmid = (latmin+latmax)/2;
var scale = 100;

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
        dimension:$('input[name=dimension]:checked', '#dimensionForm').val(),
        predicate: getValues("#predicate"),
        timestamp1: getValues("#input-timestamp-1"),
        timestamp2: getValues("#input-timestamp-2")
    };

    $.ajax({
        url: 'http://localhost:2342/snapshot/',
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

/**
 * Runs when the DOM is ready
 */
$(document).ready(function () {
    cy = buildCytoscape();

    loadDatabaseProperties();
    $('select').select2();
});

/**---------------------------------------------------------------------------------------------------------------------
 * Graph Drawing
 *-------------------------------------------------------------------------------------------------------------------*/
function buildCytoscape() {
    let cyto = cytoscape({
        container: document.getElementById('canvas'),
        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                // define label content and font
                'content': function (node) {
                    return getLabel(node, getVertexLabelKey(), useDefaultLabel);
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

                    return getLabel(edge, getEdgeLabelKey(), useDefaultLabel);
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
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

    return cyto;
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

    let isSpatial = nodes[0] != null && nodes[0]['data']['properties']['long'] != null &&
        nodes[0]['data']['properties']['lat'] != null;

    cy.elements().remove();
    cy.add(nodes);

    if (isSpatial) {
        cy.nodes().positions(function( node, i ){
            return lnglat2xy(node.data('properties')['long'], node.data('properties')['lat']);
        });
    }

    cy.add(edges);

    if ($('#hideNullGroups').is(':checked')) {
        hideNullGroups();
    }

    if ($('#hideDisconnected').is(':checked')) {
        hideDisconnected();
    }

    var theLayout = cy.layout(isSpatial ? {name: 'preset'} : getLayoutConfig(useForceLayout));
    theLayout.run();
}

function lnglat2xy(lon, lat) {
    let can = $("#canvas");
    //console.log(can);
    let w = can.width() * scale;
    //console.log('Width ' + w);

    let h = can.height() * scale;
    //console.log('Height ' + h);
    let L = lonmax2-lonmin;

    //console.log('L ' + L);
    let B = latmax-latmin;

    //console.log('B ' + B);
    let y = (B-(lat-latmin))*h/B;
    let x = (lon-lonmin)*w/L;

    return {x: x, y: y};
}


function chooseLayout() {
// options for the force layout
    let cose = {
        name: 'preset',

        // called on `layoutready`
        ready: function () {
        },

        // called on `layoutstop`
        stop: function () {
        },

        // whether to animate while running the layout
        animate: true,

        // number of iterations between consecutive screen positions update (0 ->
        // only updated on the end)
        refresh: 4,

        // whether to fit the network view after when done
        fit: true,

        // padding on fit
        padding: 30,

        // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        boundingBox: undefined,

        // whether to randomize node positions on the beginning
        randomize: true,

        // whether to use the JS console to print debug messages
        debug: false,

        // node repulsion (non overlapping) multiplier
        nodeRepulsion: 8000000,

        // node repulsion (overlapping) multiplier
        nodeOverlap: 10,

        // ideal edge (non nested) length
        idealEdgeLength: 1,

        // divisor to compute edge forces
        edgeElasticity: 100,

        // nesting factor (multiplier) to compute ideal edge length for nested edges
        nestingFactor: 5,

        // gravity force (constant)
        gravity: 250,

        // maximum number of iterations to perform
        numIter: 100,

        // initial temperature (maximum node displacement)
        initialTemp: 200,

        // cooling factor (how the temperature is reduced between consecutive iterations
        coolingFactor: 0.95,

        // lower temperature threshold (below this point the layout will end)
        minTemp: 1.0
    };

    let radialRandom = {
        name: 'preset',
        positions: function() {

            let r = Math.random() * 1000001;
            let theta = Math.random() * 2 * (Math.PI);
            return {
                x: Math.sqrt(r) * Math.sin(theta),
                y: Math.sqrt(r) * Math.cos(theta)
            };
        },
        zoom: undefined,
        pan: undefined,
        fit: true,
        padding: 30,
        animate: false,
        animationDuration: 500,
        animationEasing: undefined,
        ready: undefined,
        stop: undefined
    };

    if (useForceLayout) {
        return cose;
    } else {
        return radialRandom;
    }
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
    /*$.post('http://localhost:2342/keys/' + databaseName, function(response) {
        initializeFilterKeyMenus(response);
        initializePropertyKeyMenus(response);
        initializeAggregateFunctionMenus(response);
    }, "json");*/
}





