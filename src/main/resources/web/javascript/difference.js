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
 * Buffers the last metadata response from the server to improve redrawing speed.
 */
let bufferedMetaData = [];

let isLeafletLayoutInUsage = false;

/**
 * Initialize the page
 * */
$(document).ready(function(){
    loadDatabases();
    loadDatabaseProperties();
    buildECharts();
});

/**---------------------------------------------------------------------------------------------------------------------
 * Callbacks
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Reload the database properties whenever the database selection is changed
 */
$(document).on("change", "#databaseName", loadDatabaseProperties);

/**
 * Activate/deactivate the timestamp inputs depending on the selected predicate.
 */
$(document).on('change', '.predicate-select', function () {
    let dropdown = $(this);

    let tsInput1 = dropdown.parents('.snapshot').find('.input-timestamp-1');
    tsInput1.removeAttr('disabled');
    let tsInput2 = dropdown.parents('.snapshot').find('.input-timestamp-2');
    tsInput2.removeAttr('disabled');

    switch (dropdown.val()) {
        case 'all':
            tsInput1.attr('disabled', 'disabled');
            tsInput2.attr('disabled', 'disabled');
            break;
        case 'asOf':
            tsInput2.attr('disabled', 'disabled');
            break;
    }
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
            drawGraph(data, true);
            btn.removeClass('loading');
        }
    });
});

/**---------------------------------------------------------------------------------------------------------------------
 * Graph Drawing
 *-------------------------------------------------------------------------------------------------------------------*/

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

/**
 * Initialize the database menu according to the selected database
 */
function loadDatabaseProperties() {
    function calcLeafLetCenter(spatialData) {
        if (spatialData['min_lat'] && spatialData['min_long'] && spatialData['max_lat'] &&
            spatialData['max_long']) {
            let longCenter = (spatialData['min_long'] + spatialData['max_long']) / 2;
            let latCenter = (spatialData['min_lat'] + spatialData['max_lat']) / 2;
            leafletCenter = [longCenter, latCenter];
        }
    }
    let databaseName = $('#databaseName').val();
    if (bufferedMetaData[databaseName]) {
        let spatialData = bufferedMetaData[databaseName]['spatialData'];
        calcLeafLetCenter(spatialData);
    } else {
        $.post('http://localhost:2342/keys/' + databaseName, function(response) {
            bufferedMetaData[databaseName] = response;
            let spatialData = bufferedMetaData[databaseName]['spatialData'];
            calcLeafLetCenter(spatialData);
        }, "json");
    }
}
