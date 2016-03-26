## Coding Exercise - Trains


### Install

    $ cd path/to/trains && npm install

### Usage

#### Background

Trains is a simple directed graph implementation with a chainable API with a feature set targeted at solving the
"Trains" coding challenge.

Assumptions:

- Nodes (cities) have simple one character names
- Weights (distances) have single digit values

#### Constructing a graph

The Routes constructor accepts a single argument - an array of strings representing the origin, destination 
and weight of an edge.  For example:

    var routes = new Routes(['AB5','AC4', 'CB2']);

Will result in a set of nodes named 'A', 'B' and 'C' with the links: A -> B, A -> C and C -> B and the 
corresponding weights of 5, 4 & 2.

The newly constructed Routes object will contain the following data structures:

    { nodes: { A: { name: 'A' }, B: { name: 'B' }, C: { name: 'C' } },
      originMap: 
       { A: 
          { origin: { name: 'A' },
            destination: { name: 'B' },
            weight: 5,
            next: 
             { origin: { name: 'A' },
               destination: { name: 'C' },
               weight: 4,
               next: null } },
         C: 
          { origin: { name: 'C' },
            destination: { name: 'B' },
            weight: 2,
            next: null } } }
 
#### Using the API
 
Once constructed, a route can be constructed via the `from` method on the `routes` object.  The resulting route
has several method that will allow you to add new stops to the route, set limits on the route and to calculate
information about the final route.  The original graph is unaffected when traversing routes as all state is 
attached to the constructed route.

Routes can be passed in as a node or by key.

Below are a few examples.  For more examples, please see the unit tests.

##### Example 1: Calculate the distance from A -> B -> C

    routes
      .from(nodes.A)      // Start at A
      .to(nodes.B)        // Travel to B
      .to(nodes.C)        // Travel to C
      .maxStops(1)        // Limit stops from origin to destination at 1
      .find()             // Calculate the route
      .distance()         // Calculate and return the distance

##### Example 2: Determine the shortest route (by distance) from A -> C

    routes
      .from('A')          // Start at A
      .to('C')            // Travel to C
      .maxStops(-1)       // No limit on stops
      .find()             // Calculate all potential routes
      .shortest()         // Calculate and return the distance of the shortest route
      
##### Example 3: Find the number of routes between C -> C with a distance < 30
      
      routes
        .from('C')        // Start at C
        .to(`C`)          // Travel to C
        .shorterThan(30)  // Limit distance to < 30
        .find()           // Calculate all potential routes
        .length()         // Calculate and return the number of routes

### Running the tests

    $ npm test

-- or --

    $ grunt

### Debug output

This module was built with the [debug][1] module.  Debug output can be enabled by defining 
a `DEBUG` environment variable.  For example, when running the tests:

    $ DEBUG=trains grunt
    
will produce output for each call to `find()` with all discovered results:
    
    trains Found routes: 4 +1ms
    trains    route: "A -> B -> C" +0ms
    trains    route: "A -> D -> C" +0ms
    trains    route: "A -> D -> E -> B -> C" +0ms
    trains    route: "A -> E -> B -> C" +0ms


### License

MIT © [David J. Clarke]()


[1]: https://github.com/visionmedia/debug  "visionmedia's debug module"
