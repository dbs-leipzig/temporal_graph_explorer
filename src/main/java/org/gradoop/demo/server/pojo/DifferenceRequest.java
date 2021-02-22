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
 * A POJO class representing a request for the difference operator.
 */
public class DifferenceRequest {

  /**
   * The name of the database.
   */
  private String dbName;

  /**
   * The time dimension to consider.
   */
  private String dimension;

  /**
   * The name of the first predicate.
   */
  private String firstPredicate;

  /**
   * The first timestamp argument for the first predicate.
   */
  private String timestamp11;

  /**
   * The second timestamp argument for the first predicate.
   */
  private String timestamp12;

  /**
   * The name of the second predicate.
   */
  private String secondPredicate;

  /**
   * The first timestamp argument for the second predicate.
   */
  private String timestamp21;

  /**
   * The second timestamp argument for the second predicate.
   */
  private String timestamp22;

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

  public String getFirstPredicate() {
    return firstPredicate;
  }

  public void setFirstPredicate(String firstPredicate) {
    this.firstPredicate = firstPredicate;
  }

  public String getTimestamp11() {
    return timestamp11;
  }

  public void setTimestamp11(String timestamp11) {
    this.timestamp11 = timestamp11;
  }

  public String getTimestamp12() {
    return timestamp12;
  }

  public void setTimestamp12(String timestamp12) {
    this.timestamp12 = timestamp12;
  }

  public String getSecondPredicate() {
    return secondPredicate;
  }

  public void setSecondPredicate(String secondPredicate) {
    this.secondPredicate = secondPredicate;
  }

  public String getTimestamp21() {
    return timestamp21;
  }

  public void setTimestamp21(String timestamp21) {
    this.timestamp21 = timestamp21;
  }

  public String getTimestamp22() {
    return timestamp22;
  }

  public void setTimestamp22(String timestamp22) {
    this.timestamp22 = timestamp22;
  }
}
