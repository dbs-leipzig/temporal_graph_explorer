[![Apache License, Version 2.0, January 2004](https://img.shields.io/github/license/apache/maven.svg?label=License)](https://www.apache.org/licenses/LICENSE-2.0)

## Temporal Graph Explorer

## Description

Temporal property graphs are an intuitive way to model, analyze and visualize complex and evolving relationships among heterogeneous data objects, for example, as they occur in social, biological and information networks. These graphs typically contain thousands or millions of vertices and edges and their entire representation can easily overwhelm an analyst.

[GRADOOP](http://www.gradoop.com) is an open-source system for graph analytics that enables handling of such temporal graphs. GRADOOP and its graph model TPGM is implemented on top of [Apache Flink](http://flink.apache.org), a state-of-the-art distributed dataflow framework, and thus allows us to scale graph analytical programs across multiple machines.

The *Temporal Graph Explorer* demonstrates three TPGM operators: [Snapshot](https://github.com/dbs-leipzig/gradoop/wiki/Temporal-Graph-Support#snapshot), [Difference](https://github.com/dbs-leipzig/gradoop/wiki/Temporal-Graph-Support#difference) and [Temporal Graph Grouping](https://github.com/dbs-leipzig/gradoop/wiki/Temporal-Graph-Support#grouping). A user can choose between different input graphs and adjust the operator parameters. The computation is executed on the user machine by automatically starting an Apache Flink cluster.

### Snapshot
To enable temporal and evolutionary queries and analysis, one data management challenge for large 
historical graphs is the retrieval of graph snapshots as of any time-point in the considered time 
domain. To achieve this, we developed the snapshot operator that can be applied on
a temporal graph instance and allows to retrieve a valid state of
the graph either at a specific point in time, or a subgraph that is
valid during a time range. The user can configure the operator by
pre-defined time-dependent predicates such as `asOf()`, `overlaps()`
or `precedes()`. Furthermore, user-defined predicates, as well as
helper functions to extract certain time dimensions, can be used.

### Difference
An important part of the analysis of graphs is the examination of changes that have occurred 
between two graph states. Changes, i.e. additions, deletions, and edits, represent the evolution of 
a temporal graph and can be selected or aggregated in subsequent analysis steps. 
Therefore, we demonstrate the difference
operator that computes a graph between two graph snap-
shots by determining the union and extending
each element by a property that expresses the addition, deletion,
or persistence of this element respectively. Both snapshots can be configured by 
using time-dependent predicate functions, as
described before. In addition, the desired time-dimension can be
selected.

### Temporal Graph Grouping 

One way to reduce complexity of a large temporal property graph is the grouping of vertices and edges to summary graphs. We developed an algorithm for graph grouping with support for attribute aggregation as well as structural and temporal summarization by pre-defined and user-defined grouping key functions. The operation is very similar to a GROUP BY operation known from relational databases but in addition summarizes the graph structure according to the computed vertex and edge groups.

## Demo Instructions

* Clone the repo
* `$ mvn clean install`
* `$ mvn exec:java -Dexec.mainClass="org.gradoop.demo.server.Server"`
* Navigate to `http://localhost:2342/gradoop/html/snapshot.html` or `http://localhost:2342/gradoop/html/difference.html` or `http://localhost:2342/gradoop/html/keyedgrouping.html`
* Select data set from drop down list
* Enjoy

#### Add new graphs

* Create a temporal CSV graph using Gradoop (see [Gradoop Examples](https://github.com/dbs-leipzig/gradoop/wiki/Examples))
* Copy CSV graph to `src/main/resources/data`
* Add it to the input graph drop-down of the html files
* Restart the server

### Further reading

* [Evolution Analysis of Large Graphs with Gradoop, Workshop LEG@ECMLPKDD 2019, Sep. 2019](https://dbs.uni-leipzig.de/file/LEGECML-PKDD_2019_paper_9.pdf)
* [Analyzing Temporal Graphs with Gradoop, Datenbank Spektrum 19(3), Nov. 2019](https://link.springer.com/article/10.1007/s13222-019-00325-8)
* [Gradoop Wiki](https://github.com/dbs-leipzig/gradoop/wiki)
* [Gradoop Source Code](http://www.gradoop.com)
* [Gradoop Project Page, University of Leipzig](http://dbs.uni-leipzig.de/research/projects/gradoop)

> This is an extension of the [Gradoop Demo](https://github.com/dbs-leipzig/gradoop_demo).

### Disclaimer

Apache&reg;, Apache Flink and Flink&reg; are either registered trademarks or trademarks of the Apache Software Foundation 
in the United States and/or other countries.

