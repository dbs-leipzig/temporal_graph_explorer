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

import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.util.Collector;
import org.gradoop.temporal.model.impl.pojo.TemporalGraphHead;

import static org.gradoop.demo.server.RequestHandler.MIN_LAT;
import static org.gradoop.demo.server.RequestHandler.MAX_LAT;
import static org.gradoop.demo.server.RequestHandler.MIN_LONG;
import static org.gradoop.demo.server.RequestHandler.MAX_LONG;

/**
 * Flat map function to extract min/max aggregates of temporal attributes of the graph head.
 */
public class PropertyKeyValueMapper implements FlatMapFunction<TemporalGraphHead, Tuple2<String, Double>> {
  @Override
  public void flatMap(TemporalGraphHead graphHead, Collector<Tuple2<String, Double>> out) {
    addPropertyValue(graphHead, out, MIN_LAT);
    addPropertyValue(graphHead, out, MAX_LAT);
    addPropertyValue(graphHead, out, MIN_LONG);
    addPropertyValue(graphHead, out, MAX_LONG);
  }

  /**
   * Adds a property from the given graph head to the collector. If the property is not available, a tuple
   * {key, 0.} is collected.
   *
   * @param graphHead the graph head to fetch the property
   * @param out the collector
   * @param key the property key of the property
   */
  private void addPropertyValue(TemporalGraphHead graphHead, Collector<Tuple2<String, Double>> out, String key) {
    double doubleValue = 0.;
    if (graphHead.hasProperty(key) && graphHead.getPropertyValue(key).isDouble()) {
      doubleValue = graphHead.getPropertyValue(key).getDouble();
    }
    out.collect(new Tuple2<>(key, doubleValue));
  }
}
