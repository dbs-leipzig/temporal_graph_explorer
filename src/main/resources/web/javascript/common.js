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
 * Map of all possible values for the vertexLabelKey to a color in RGB format.
 * @type {{}}
 */
let colorMap = {};

/**
 * Buffers the last graph response from the server to improve redrawing speed.
 */
let bufferedData;


/**----------------
 * Callbacks
 *------------------*/

/**
 * Whenever one of the view options is changed, redraw the graph
 */
$(document).on("change", '.redraw', function() {
    drawGraph(bufferedData, false);
});

function cytoReady() {
    window.cy = this;
    cy.elements().unselectify();
    /* if a vertex is selected, fade all edges and vertices
    that are not in direct neighborhood of the vertex */
    cy.on('tap', 'node', nodeTap);
    cy.on('tap', 'edge', edgeTap);

    // remove fading by clicking somewhere else
    cy.on('tap', function (e) {
        if (e.target === cy) {
            cy.elements().removeClass('faded');
        }
    });
}

/**
 * Callback for tapping on a node.
 *
 * @param event
 */
function nodeTap(event) {
    let node = event.target;
    let neighborhood = node.neighborhood().add(node);

    cy.elements().addClass('faded');
    neighborhood.removeClass('faded');

    let ref = node.popperRef(); // used only for positioning
    let dummyDomEle = document.createElement('div');

    let tip = tippy(dummyDomEle, { // tippy options:
        // mandatory:
        trigger: 'manual', // call show() and hide() yourself
        getReferenceClientRect: ref.getBoundingClientRect,

        content: () => {
            let content = document.createElement('div');

            let qtipText = '';
            let label = this.data()['label'];

            if (label != null) {
                qtipText += '<b>' + label + '</b><br>';
            }
            for (let [key, value] of Object.entries(this.data('properties'))) {
                if (key === 'label') {
                    qtipText += '<b>' + value + '</b><br>';
                } else if (key === 'id' || key === 'source' || key === 'target'){
                    // don't print
                } else {
                    qtipText += key + ' : ' + value + '<br>';
                }
            }
            content.innerHTML = qtipText;
            return content;
        }
    });
    tip.show();
}

/**
 * Callback for tapping on an edge.
 *
 * @param event
 */
function edgeTap(event) {
    let edge = event.target;
    let nodes = edge.connectedNodes().add(edge);
    cy.elements().addClass('faded');
    nodes.removeClass('faded');

    let ref = edge.popperRef(); // used only for positioning
    let dummyDomEle = document.createElement('div');

    let tip = tippy(dummyDomEle, { // tippy options:
        // mandatory:
        trigger: 'manual', // call show() and hide() yourself
        getReferenceClientRect: ref.getBoundingClientRect,

        // your custom options follow:

        content: () => {
            let content = document.createElement('div');

            let qtipText = '';
            let label = this.data()['label'];

            if (label != null) {
                qtipText += '<b>' + label + '</b><br>';
            }

            for (let [key, value] of Object.entries(this.data('properties'))) {
                qtipText += key + ' : ' + value + '<br>';
            }


            content.innerHTML = qtipText;

            return content;
        }
    });

    tip.show();
}


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
 * Get the label of the given element, either the default label ('label') or the value of the
 * given property key
 *
 * @param element the element whose label is needed
 * @param key key of the non-default label
 * @param useDefaultLabel boolean specifying if the default label shall be used
 * @returns {string} the label of the element
 */
function getLabel(element, key, useDefaultLabel) {
    let label = '';
    if (!useDefaultLabel && key !== 'label') {
        label += element.data('properties')[key];
    } else {
        label += element.data('label');
    }
    return label;
}

/**
 * Returns the vertex label which is stored as a property key.
 *
 * @returns {string|*} the label
 */
function getVertexLabelKey() {
    let values = getValues("#vertexPropertyKeys");
    return values.length === 0 ? "label" : values[0];
}

/**
 * Returns the edge label which is stored as a property key.
 *
 * @returns {string|*} the label
 */
function getEdgeLabelKey() {
    let values = getValues("#edgePropertyKeys");
    return values.length === 0 ? "label" : values[0];
}

/**
 * Generate a random color for each label.
 *
 * @param labels
 */
function generateRandomColors(labels) {
    colorMap = {};
    labels.forEach(function (label) {
        let r = 0;
        let g = 0;
        let b = 0;
        while (r + g + b < 382) {
            r = Math.floor((Math.random() * 255));
            g = Math.floor((Math.random() * 255));
            b = Math.floor((Math.random() * 255));
        }
        colorMap[label] = [r, g, b];
    });
}

/**
 * Get the layout for cytoscape
 *
 * @param useForceDirectedLayout true, if 'cose' layout (force directed) should be used
 * @returns a cytoscape layout config
 */
function getLayoutConfig(useForceDirectedLayout) {
// options for the force layout
    let cose = {
        name: 'cose',

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
        gravity: 100,

        // maximum number of iterations to perform
        numIter: 50,

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

    if (useForceDirectedLayout) {
        return cose;
    } else {
        return radialRandom;
    }
}
