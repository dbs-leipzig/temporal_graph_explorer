/**---------------------------------------------------------------------------------------------------------------------
 * Global Values
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Map of all possible values for the vertexLabelKey to a color in RGB format.
 * @type {{}}
 */
let diffColorMap = { '-1' : '#f4451f', '0' : '#999', '1' : '#73db46'};

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

/**
 * Initialize the page
 * */
$(document).ready(function(){
    buildCytoscape();
    $('select').select2();
});

/**---------------------------------------------------------------------------------------------------------------------
 * Callbacks
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * When the 'Execute' button is clicked, construct a request and send it to the server
 */
$(document).on('click', ".execute-button", function () {
    let btn = $(this);
    btn.addClass("loading");
    let reqData = {
        dbName: getSelectedDatabase(),
        dimension:$('input[name=dimension]:checked', '#dimensionForm').val(),
        firstPredicate: getValues("#firstPredicate"),
        timestamp11: getValues("#input-timestamp-1-1"),
        timestamp12: getValues("#input-timestamp-1-2"),
        secondPredicate: getValues("#secondPredicate"),
        timestamp21: getValues("#input-timestamp-2-1"),
        timestamp22: getValues("#input-timestamp-2-2")
    };

    $.ajax({
        url: 'http://localhost:2342/difference/',
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
                // set background color according to color map
                'background-color': function (node) {
                    let diff = node.data('properties')['_diff'];
                    return  diffColorMap[diff];
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
                'line-color': function (node) {
                    let diff = node.data('properties')['_diff'];
                    return  diffColorMap[diff];
                },
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
 * Function called when the server returns the data
 *
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
    }

    cy.elements().remove();
    cy.add(nodes);

    cy.nodes().positions(function( node, i ){
        return lnglat2xy(node.data('properties')['long'], node.data('properties')['lat']);
    });

    cy.add(edges);

    if ($('#hideNullGroups').is(':checked')) {
        hideNullGroups();
    }

    if ($('#hideDisconnected').is(':checked')) {
        hideDisconnected();
    }

    let layout = cy.layout(getLayoutConfig(useForceLayout));
    layout.run();
}

/**---------------------------------------------------------------------------------------------------------------------
 * Utility Functions
 *-------------------------------------------------------------------------------------------------------------------*/

function lnglat2xy(lon, lat) {
    let can = $("#canvas");
    let w = can.width() * scale;

    let h = can.height() * scale;
    let L = lonmax2-lonmin;

    let B = latmax-latmin;

    let y = (B-(lat-latmin))*h/B;
    let x = (lon-lonmin)*w/L;

    return {x: x, y: y};
}