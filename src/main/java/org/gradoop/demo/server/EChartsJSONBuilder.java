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
package org.gradoop.demo.server;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.api.entities.GraphElement;
import org.gradoop.common.model.impl.properties.Property;
import org.gradoop.temporal.model.impl.pojo.TemporalEdge;
import org.gradoop.temporal.model.impl.pojo.TemporalElement;
import org.gradoop.temporal.model.impl.pojo.TemporalGraphHead;
import org.gradoop.temporal.model.impl.pojo.TemporalVertex;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.TimeZone;
import java.util.stream.Collectors;

/**
 * Converts a logical graph or a read JSON into a eCharts-conform JSON.
 */
public class EChartsJSONBuilder {
  /**
   * Key for vertex, edge and graph id.
   */
  private static final String IDENTIFIER = "id";
  /**
   * Key for the type of the returned JSON, either graph or collection.
   */
  private static final String TYPE = "type";
  /**
   * Key for vertex, edge and graph label.
   */
  private static final String LABEL = "label";
  /**
   * Key for graph identifiers at vertices and edges.
   */
  private static final String GRAPHS = "graphs";
  /**
   * Key for properties of graphs, vertices and edges.
   */
  private static final String PROPERTIES = "properties";
  /**
   * Key for vertex identifiers at graphs.
   */
  private static final String VERTICES = "nodes";
  /**
   * Key for edge identifiers at graphs.
   */
  private static final String EDGES = "edges";
  /**
   * Key for edge source vertex id.
   */
  private static final String EDGE_SOURCE = "source";
  /**
   * Key for edge target vertex id.
   */
  private static final String EDGE_TARGET = "target";

  /**
   * A color map for label colors.
   */
  private static final HashMap<String, String> LABEL_COLOR_MAP = new HashMap<>();

  /**
   * Takes a logical graph and converts it into a eCharts-conform JSON.
   *
   * @param graphHeads the graph heads
   * @param vertices  the vertices
   * @param edges     the edges
   * @return a eCharts-conform JSON
   * @throws JSONException if the creation of the JSON fails
   */
  static String getJSONString(
    List<TemporalGraphHead> graphHeads,
    List<TemporalVertex> vertices,
    List<TemporalEdge> edges) throws JSONException {

    JSONObject returnedJSON = new JSONObject();

    boolean hasSpatialVertexProperties = !vertices.isEmpty();

    List<JSONObject> graphObjects = graphHeads.stream().map(EChartsJSONBuilder::getGraphHeadObject)
      .collect(Collectors.toList());

    returnedJSON.put(GRAPHS, graphObjects);

    JSONArray vertexArray = new JSONArray();
    for (TemporalVertex vertex : vertices) {
      JSONObject vertexObject = getVertexObject(vertex);
      vertexArray.put(vertexObject);

      hasSpatialVertexProperties = hasSpatialVertexProperties && vertexObject.has("value") &&
        vertexObject.getJSONArray("value").getDouble(0) != 0. &&
        vertexObject.getJSONArray("value").getDouble(1) != 0.;
    }
    returnedJSON.put(VERTICES, vertexArray);

    returnedJSON.put(TYPE, hasSpatialVertexProperties ? "spatialGraph" : "graph");

    JSONArray edgeArray = new JSONArray();
    for (TemporalEdge edge : edges) {
      edgeArray.put(getEdgeObject(edge));
    }
    returnedJSON.put(EDGES, edgeArray);

    return returnedJSON.toString();
  }

  /**
   * Get a JSON object representing a Gradoop graph head.
   *
   * @param graphHead the graph head instance to translate
   * @return the JSON object representing the graph head
   */
  private static JSONObject getGraphHeadObject(TemporalGraphHead graphHead) {
    try {
      JSONObject graphObject = new JSONObject();

      JSONObject graphProperties = new JSONObject();
      graphObject.put(IDENTIFIER, graphHead.getId());
      graphObject.put(LABEL, graphHead.getLabel());
      if (graphHead.getProperties() != null) {
        for (Property prop : graphHead.getProperties()) {
          graphProperties.put(prop.getKey(), prop.getValue());
        }
      }
      graphObject.put(PROPERTIES, graphProperties);
      addTemporalProperties(graphObject, graphHead);
      return graphObject;
    } catch (JSONException exception) {
      throw new RuntimeException("Failed parsing graph head.");
    }
  }

  /**
   * Get a JSON object representing a Gradoop vertex.
   *
   * @param vertex the vertex instance to translate
   * @return the JSON object representing the vertex
   */
  private static JSONObject getVertexObject(TemporalVertex vertex) throws JSONException {
    JSONObject vertexObject = new JSONObject();
    JSONObject vertexData = new JSONObject();
    JSONArray nodeValues = new JSONArray();

    vertexData.put(IDENTIFIER, vertex.getId());
    vertexData.put(LABEL, vertex.getLabel());

    vertexObject.put("itemStyle", new JSONObject().put("color", getElementColor(vertex)));

    JSONObject vertexProperties = new JSONObject();
    if (vertex.getProperties() != null) {
      if (vertex.hasProperty("long")) {
        if (vertex.getPropertyValue("long").isDouble()) {
          nodeValues.put(0, vertex.getPropertyValue("long").getDouble());
        } else if (vertex.getPropertyValue("long").isString()) {
          nodeValues.put(0, Double.parseDouble(vertex.getPropertyValue("long").getString()));
        }
      } else {
        nodeValues.put(0, 0);
      }
      if (vertex.hasProperty("lat")) {
        if (vertex.getPropertyValue("lat").isDouble()) {
          nodeValues.put(1, vertex.getPropertyValue("lat").getDouble());
        } else if (vertex.getPropertyValue("lat").isString()) {
          nodeValues.put(1, Double.parseDouble(vertex.getPropertyValue("lat").getString()));
        }
      } else {
        nodeValues.put(1, 0);
      }
      for (Property prop : vertex.getProperties()) {
        vertexProperties.put(prop.getKey(), prop.getValue());
      }
    }

    vertexData.put(PROPERTIES, vertexProperties);
    addTemporalProperties(vertexData, vertex);
    nodeValues.put(2, vertexData);

    vertexObject.put("name", vertex.getId());
    vertexObject.put("value", nodeValues);
    return vertexObject;
  }

  /**
   * Get a JSON object representing a Gradoop edge.
   *
   * @param edge the graph head instance to translate
   * @return the JSON object representing the edge
   */
  private static JSONObject getEdgeObject(TemporalEdge edge) throws JSONException {
    JSONObject edgeObject = new JSONObject();
    JSONObject edgeData = new JSONObject();
    JSONArray edgeValues = new JSONArray();
    JSONObject lineStyle = new JSONObject();

    edgeObject.put(EDGE_SOURCE, edge.getSourceId());
    edgeObject.put(EDGE_TARGET, edge.getTargetId());

    edgeObject.put("lineStyle", lineStyle.put("color", getElementColor(edge)));

    edgeData.put(IDENTIFIER, edge.getId());
    edgeData.put(LABEL, edge.getLabel());
    JSONObject edgeProperties = new JSONObject();
    if (edge.getProperties() != null) {
      for (Property prop : edge.getProperties()) {
        edgeProperties.put(prop.getKey(), prop.getValue());
      }
    }
    edgeData.put(PROPERTIES, edgeProperties);
    addTemporalProperties(edgeData, edge);
    edgeValues.put(2, edgeData);
    edgeObject.put("value", edgeValues);
    return edgeObject;
  }

  /**
   * Adds the four bitemporal attributes of the temporal element to the given json object.
   *
   * @param object the JSON object to add the attributes.
   * @param element the temporal element to extract the bitemporal attributes
   * @throws JSONException in case of a parsing error
   */
  private static void addTemporalProperties(JSONObject object, TemporalElement element) throws JSONException {
    DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
    object.put("val_from", formatter.format(new Date(element.getValidFrom())));
    object.put("val_to", formatter.format(new Date(element.getValidTo())));
    object.put("tx_from", formatter.format(new Date(element.getTxFrom())));
    object.put("tx_to", formatter.format(new Date(element.getTxTo())));
  }

  /**
   * Returns true, iff the given property has a property named '_diff' of type Integer.
   *
   * @param element the element to check
   * @return true, iff the given property has a property named '_diff' of type Integer
   */
  private static boolean hasDiffProperty(GraphElement element) {
    return element.hasProperty("_diff") && element.getPropertyValue("_diff").isInt();
  }

  /**
   * Get the vertex/edge color according to the value of the '_diff' property or the label
   *
   * @param element the graph element that may store the property named '_diff'
   * @return a hexadecimal color code as String
   */
  private static String getElementColor(GraphElement element) {
    // first check if a _diff property is available
    if (hasDiffProperty(element)) {
      switch (element.getPropertyValue("_diff").getInt()) {
      case 1: return "#73db46";
      case -1: return "#f4451f";
      case 0:
      default: return "#999999";
      }
    }
    // then color by label
    if (!LABEL_COLOR_MAP.containsKey(element.getLabel())) {
      int r = 0;
      int g = 0;
      int b = 0;
      while (r + g + b < 382) {
        r = (int) Math.floor((Math.random() * 255));
        g = (int) Math.floor((Math.random() * 255));
        b = (int) Math.floor((Math.random() * 255));
      }
      LABEL_COLOR_MAP.put(element.getLabel(), String. format("#%02X%02X%02X", r, g, b));
    }
    return LABEL_COLOR_MAP.get(element.getLabel());
  }
}
