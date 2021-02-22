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
 * POJO class that contains the arguments of a grouping key function.
 */
public class KeyFunctionArguments {
  /**
   * The type of the element for which the aggregate function is used. Either {@code vertex} or {@code edge}.
   */
  private String type;

  /**
   * The identifier of the aggregate function. E.g., {@code count} or {@code minProp}.
   */
  private String key;

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

  /**
   * The temporal field which will be extracted from the aggregated timestamp, e.g., {@code day} or
   * {@code minute}. (Optional)
   */
  private String field;

  /**
   * The temporal unit to consider, e.g., {@code SECONDS} OR {@code MINUTES}. See
   * {@link java.time.temporal.ChronoUnit} for all possible types. (Optional)
   */
  private String unit;

  /**
   * The label of the element if this key function should be label specific. (Optional)
   */
  private String labelspec;

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
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

  public String getField() {
    return field;
  }

  public void setField(String field) {
    this.field = field;
  }

  public String getUnit() {
    return unit;
  }

  public void setUnit(String unit) {
    this.unit = unit;
  }

  public String getLabelspec() {
    return labelspec;
  }

  public void setLabelspec(String labelSpec) {
    this.labelspec = labelSpec;
  }

  public String getPeriodBound() {
    return periodBound;
  }

  public void setPeriodBound(String periodBound) {
    this.periodBound = periodBound;
  }
}
