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
 * POJO class that contains the arguments of a aggregation function.
 */
public class AggFunctionArguments {
  /**
   * The type of the element for which the aggregate function is used. Either {@code vertex} or {@code edge}.
   */
  private String type;

  /**
   * The identifier of the aggregate function. E.g., {@code count} or {@code minProp}.
   */
  private String agg;

  /**
   * The property key. (Optional)
   */
  private String prop;

  /**
   * The time dimension, either {@code TRANSACTION_TIME} or {@code VALID_TIME}. (Optional)
   */
  private String dimension;

  /**
   * The period bound, either {@code FROM} or {@code TO}. (Optional)
   */
  private String periodBound;

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getAgg() {
    return agg;
  }

  public void setAgg(String agg) {
    this.agg = agg;
  }

  public String getProp() {
    return prop;
  }

  public void setProp(String prop) {
    this.prop = prop;
  }

  public String getDimension() {
    return dimension;
  }

  public void setDimension(String dimension) {
    this.dimension = dimension;
  }

  public String getPeriodBound() {
    return periodBound;
  }

  public void setPeriodBound(String periodBound) {
    this.periodBound = periodBound;
  }
}
