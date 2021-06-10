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
package org.gradoop.demo.server.functions;

import org.gradoop.common.model.impl.properties.PropertyValue;
import org.gradoop.temporal.model.api.TimeDimension;
import org.gradoop.temporal.model.impl.operators.aggregation.functions.MinTime;

import java.text.DateFormat;
import java.util.Date;

/**
 * Aggregation function similar to {@link MinTime} but with a formatted property as result.
 */
public class FormattedMinTime extends MinTime {

  /**
   * The formatter used to format the resulting {@link Long} timestamp.
   */
  private final DateFormat formatter;

  /**
   * Creates an instance of this aggregate function.
   *
   * @param aggregatePropertyKey the property key to store the aggregated value
   * @param dimension the time dimension to use
   * @param field the field of the time period to use
   * @param formatter the formatter to format the resulting {@link Long} timestamp
   */
  public FormattedMinTime(String aggregatePropertyKey, TimeDimension dimension, TimeDimension.Field field,
    DateFormat formatter) {
    super(aggregatePropertyKey, dimension, field);
    this.formatter = formatter;
  }

  @Override
  public PropertyValue postAggregate(PropertyValue result) {
    if (result.isLong()) {
      String formattedTime = formatter.format(new Date(result.getLong()));
      result.setString(formattedTime);
    }
    return result;
  }
}
