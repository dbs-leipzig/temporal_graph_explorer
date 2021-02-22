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
import org.gradoop.common.model.api.entities.Edge;
import org.gradoop.common.model.api.entities.GraphHead;
import org.gradoop.common.model.api.entities.Vertex;
import org.gradoop.common.model.impl.properties.Property;
import org.gradoop.temporal.model.impl.pojo.TemporalEdge;
import org.gradoop.temporal.model.impl.pojo.TemporalGraphHead;
import org.gradoop.temporal.model.impl.pojo.TemporalVertex;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Converts a logical graph or a read JSON into a cytoscape-conform JSON.
 */
public class CytoJSONBuilder {
  /**
   * Key for vertex, edge and graph id.
   */
  private static final String IDENTIFIER = "id";
  /**
   * Key for the type of the returned JSON, either graph or collection.
   */
  private static final String TYPE = "type";
  /**
   * Key for meta Json object.
   */
  private static final String META = "meta";
  /**
   * Key for data Json object.
   */
  private static final String DATA = "data";
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
   * Takes a logical graph and converts it into a cytoscape-conform JSON.
   *
   * @param graphHeads the graph heads
   * @param vertices  the vertices
   * @param edges     the edges
   * @return a cytoscape-conform JSON
   * @throws JSONException if the creation of the JSON fails
   */
  static String getJSONString(List<TemporalGraphHead> graphHeads,
    List<TemporalVertex> vertices,
    List<TemporalEdge> edges)
    throws JSONException {

    JSONObject returnedJSON = new JSONObject();

    returnedJSON.put(TYPE, "graph");

    List<JSONObject> graphObjects = graphHeads.stream().map(CytoJSONBuilder::getGraphHeadObject)
      .collect(Collectors.toList());

    returnedJSON.put(GRAPHS, graphObjects);

    JSONArray vertexArray = new JSONArray();
    for (TemporalVertex vertex : vertices) {
      vertexArray.put(getVertexObject(vertex));
    }
    returnedJSON.put(VERTICES, vertexArray);

    JSONArray edgeArray = new JSONArray();
    for (TemporalEdge edge : edges) {
      edgeArray.put(getEdgeObject(edge));
    }
    returnedJSON.put(EDGES, edgeArray);

    return returnedJSON.toString();
  }

  private static JSONObject getGraphHeadObject(GraphHead graphHead) {
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
      return graphObject.put(PROPERTIES, graphProperties);
    } catch (JSONException exception) {
      throw new RuntimeException("Failed parsing graph head.");
    }
  }

  private static JSONObject getVertexObject(Vertex vertex) throws JSONException {
    JSONObject vertexObject = new JSONObject();
    JSONObject vertexData = new JSONObject();

    vertexData.put(IDENTIFIER, vertex.getId());
    vertexData.put(LABEL, vertex.getLabel());
    JSONObject vertexProperties = new JSONObject();
    if (vertex.getProperties() != null) {
      for (Property prop : vertex.getProperties()) {
        vertexProperties.put(prop.getKey(), prop.getValue());
      }
    }
    vertexData.put(PROPERTIES, vertexProperties);
    vertexObject.put(DATA, vertexData);
    return vertexObject;
  }

  private static JSONObject getEdgeObject(Edge edge) throws JSONException {
    JSONObject edgeObject = new JSONObject();
    JSONObject edgeData = new JSONObject();
    edgeData.put(EDGE_SOURCE, edge.getSourceId());
    edgeData.put(EDGE_TARGET, edge.getTargetId());
    edgeData.put(IDENTIFIER, edge.getId());
    edgeData.put(LABEL, edge.getLabel());
    JSONObject edgeProperties = new JSONObject();
    if (edge.getProperties() != null) {
      for (Property prop : edge.getProperties()) {
        edgeProperties.put(prop.getKey(), prop.getValue());
      }
    }
    edgeData.put(PROPERTIES, edgeProperties);
    edgeObject.put(DATA, edgeData);
    return edgeObject;
  }
}
