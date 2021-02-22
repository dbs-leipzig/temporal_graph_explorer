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

/**
 * A POJO class representing a request for the snapshot operator.
 */
public class SnapshotRequest {

  /**
   * The name of the database.
   */
  private String dbName;

  /**
   * The time dimension to consider.
   */
  private String dimension;

  /**
   * The name of the predicate.
   */
  private String predicate;

  /**
   * The first timestamp argument for the predicate.
   */
  private String timestamp1;

  /**
   * The second timestamp argument for the predicate.
   */
  private String timestamp2;

  public String getDbName() {
    return dbName;
  }

  public void setDbName(String dbName) {
    this.dbName = dbName;
  }

  public String getDimension() {
    return dimension;
  }

  public void setDimension(String dimension) {
    this.dimension = dimension;
  }

  public String getPredicate() {
    return predicate;
  }

  public void setPredicate(String predicate) {
    this.predicate = predicate;
  }

  public String getTimestamp1() {
    return timestamp1;
  }

  public void setTimestamp1(String timestamp1) {
    this.timestamp1 = timestamp1;
  }

  public String getTimestamp2() {
    return timestamp2;
  }

  public void setTimestamp2(String timestamp2) {
    this.timestamp2 = timestamp2;
  }
}
