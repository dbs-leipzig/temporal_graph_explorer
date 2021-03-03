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
package org.gradoop.demo.server.pojo;

import java.util.List;

/**
 * A POJO class representing a request for the keyed grouping operator.
 */
public class KeyedGroupingRequest {
  /**
   * The name of the database.
   */
  private String dbName;

  /**
   * A list of key functions.
   */
  private List<KeyFunctionArguments> keyFunctions;

  /**
   * A list of aggregate functions.
   */
  private List<AggFunctionArguments> aggFunctions;

  /**
   * An array of vertex filters.
   */
  private String[] vertexFilters;

  /**
   * An array of edge filters.
   */
  private String[] edgeFilters;

  /**
   * True, if all edges shall be filtered.
   */
  private boolean filterAllEdges;

  public String getDbName() {
    return dbName;
  }

  public void setDbName(String dbName) {
    this.dbName = dbName;
  }

  public List<KeyFunctionArguments> getKeyFunctions() {
    return keyFunctions;
  }

  public void setKeyFunctions(List<KeyFunctionArguments> keyFunctions) {
    this.keyFunctions = keyFunctions;
  }

  public List<AggFunctionArguments> getAggFunctions() {
    return aggFunctions;
  }

  public void setAggFunctions(List<AggFunctionArguments> aggFunctions) {
    this.aggFunctions = aggFunctions;
  }

  public String[] getVertexFilters() {
    return vertexFilters;
  }

  public void setVertexFilters(String[] vertexFilters) {
    this.vertexFilters = vertexFilters;
  }

  public String[] getEdgeFilters() {
    return edgeFilters;
  }

  public void setEdgeFilters(String[] edgeFilters) {
    this.edgeFilters = edgeFilters;
  }

  public boolean getFilterAllEdges() {
    return filterAllEdges;
  }

  public void setFilterAllEdges(boolean filterAllEdges) {
    this.filterAllEdges = filterAllEdges;
  }
}
