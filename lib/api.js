var assert  = require('assert');
var _       = require('lodash');
var debug   = require('debug')('trains');
var Node    = require('./node');
var Edge    = require('./edge');

var NO_SUCH_ROUTE = "NO SUCH ROUTE";

/*
 * Converts a route to a string of the form A -> B -> C
 */
function _routeAsString(route) {
  return _(route)
    .map(function(edge) { return edge.origin.name; })
    .tap(function(array) { array.push(route[route.length-1].destination.name); })
    .value()
    .join(' -> ');
}

/*
 * Debug output a list of routes
 */
function debugRoutes(routes) {
  if(debug.enabled) {
    debug('Found routes: %s', routes.length);
    _.forEach(routes, function(route) {
      debug('   route: %j', _routeAsString(route));
    }.bind(this));
  }
}

/*
 * Limit the number of stops to maxStops.
 *
 * If -1, stops are not limited.
 *
 * When maxStops is invoked, nodes will not be visited more that once while
 * traversing a single route.  Subsequently calling  maxDistance/ShorterThan
 * disable maxStops.
 */
function maxStops(maxStops) {
  this.find = finder(maxStops,findRoutesByStops);
  return this;
}

/*
 * Limit the maximum distance of any route to the provided distance (<=)
 *
 * When maxDistance is invoked, nodes may be visited more than once while traversing
 * a single route.  Subsequently calling maxStops will disable maxDistance and limit
 * visits to 1.
 */
function maxDistance(maxDistance) {
  this.find = finder(maxDistance, findRoutesByDistance);
  return this;
}

/*
 * Limit the maximum distance of any route to the provided distance - 1 (<)
 *
 * When shorterThan is invoked, nodes may be visited more than once while traversing
 * a single route.  Subsequently calling maxStops will disable shorterThan and limit
 * visits to 1.
 */
function shorterThan(distance) {
  this.find = finder(distance - 1, findRoutesByDistance);
  return this;
}

/*
 * Appends a node to path to be traversed
 */
function to(node) {
  if(_.isString(node)) { node = this.nodes[node]; }

  assert(node, 'from: Bad or missing node argument: ' + node);

  this.path.push(node);
  return this;
}

/*
 * Generate a find function using the provided find algorithm and max value.
 *
 * The resulting find function will traverse and generate a list of all possible routes
 * given the limits of max & findFn.
 *
 */
function finder(max, findFn) {
  return function findRoutes() {
    var nodes     = this.path;
    var stop      = nodes.length - 1;
    var notFound  = false;

    var newRoutes;

    // Calculate all possible routes and assign the result to the context of this call.
    this.routes = _.reduce(nodes, function(routes, node, idx) {
      // Return early if a route was not found at any point.
      // Note: this does not short circuit the _.reduce iteration and is a candidate for optimization
      if(notFound || idx >= stop) { return routes; }

      newRoutes = findFn.call(this, node, nodes[idx+1], max);
      notFound  = newRoutes.length === 0;
      routes    = notFound ? [] : routes.concat(newRoutes);

      return routes;
    }.bind(this),[]);

    debugRoutes(this.routes);
    return this;
  }
}

/*
 * Calculates the distance of all routes discovered via find
 */
function distance() {
  if(!this.routes.length) { return NO_SUCH_ROUTE; }

  return _.reduce(this.routes, function(distance, route) {
    return distance + _.sumBy(route, 'weight');
  }.bind(this),0);
}

/*
 * Returns the number of routes discovered via find
 */
function length() {
  return this.routes.length ? this.routes.length : NO_SUCH_ROUTE;
}

/*
 * Filters discovered routes and includes only those with the specified
 * number of stops.
 */
function stops(stops) {
  this.routes = _.filter(this.routes, {length: stops});
  return this;
}

/*
 * Calculates the shortest route (by distance) of the discovered routes.
 */
function shortest() {
  if(!this.routes.length) { return NO_SUCH_ROUTE; }

  return _.min(_.map(this.routes, function(route) {
    return _.sumBy(route, 'weight');
  }));
}

/*
 * Depth first algorithm to discover all routes.  Results will be limited
 * by maxStops (if >= 0) and by only allowing a node to be visited once per
 * discovered route.
 *
 * All discovered routes will be collected and assigned to the context of
 * the original call to this function.
 */
function findRoutesByStops(start, stop, maxStops, depth, curRoute) {
  var routes  = [];
  var visited = this.visited;

  depth    = depth    || 1;
  curRoute = curRoute || [];

  // If the start node doesn't exist, return an empty array - no routes
  if(!this.originMap[start.name]) { return routes; }

  // Not a candidate route if we've exceeded our stops
  if((maxStops >= 0) && (depth > maxStops)) { return routes; }

  visited[start.name] = true;

  var edge = this.originMap[start.name];
  while(edge != null) {
    // Push the current edge onto the stack
    curRoute.push(edge);

    // If we've found our destination, push a copy of current route onto the list of discovered routes
    if(edge.destination.name === stop.name) {
      routes.push(curRoute.slice(0));
    } else if(!visited[edge.destination.name]) {
      // Keep going if we haven't visited the current edge's destination, passing edge.destination as the
      // new start point.  When coming back. join any found routes with the current list.
      routes = _.concat(routes, findRoutesByStops.call(this, edge.destination, stop, maxStops, depth + 1, curRoute.slice(0)));
    }

    // Nothing more to see here, pop the last edge off the stack and continue on
    curRoute.pop();
    edge = edge.next;
  }

  // Pop the last edge off the stack and return after setting visited to false
  curRoute.pop();
  visited[start.name] = false;
  return routes;
};

/*
 * Depth first algorithm to discover all routes <= the provided maxDistance.  Results will be
 * limited by maxDistance.
 *
 * All discovered routes will be collected and assigned to the context of
 * the original call to this function.
 */
function findRoutesByDistance(start, stop, maxDistance, distance, curRoute) {
  var routes  = [];

  distance = distance || 0;
  curRoute = curRoute || [];

  // If the start node doesn't exist, return an empty array - no routes
  if(!this.originMap[start.name]) { return routes; }

  var edge = this.originMap[start.name];
  while(edge != null) {
    // Push the newest edge onto the stack and adjust the distance
    curRoute.push(edge);
    distance += edge.weight;

    // If we are stil less than or equal to maxDistance
    if(distance <= maxDistance) {
      // and we've found the target destination then push the route onto the list of discovered routes
      if(edge.destination.name === stop.name) {
        routes.push(curRoute.slice(0));
      }

      // Keep going! When coming back. join any found routes with the current list.
      routes = _.concat(routes, findRoutesByDistance.call(this, edge.destination, stop, maxDistance, distance, curRoute.slice(0)));
    }

    // Pop the previous route off the stack and adjust the distance
    distance -= curRoute.pop().weight;
    edge = edge.next;
  }

  // Pop the previous route off the stack and adjust the distance
  distance -= (curRoute.pop() || {}).weight || 0;
  return routes;
};


module.exports.to             = to;
module.exports.maxStops       = maxStops;
module.exports.maxDistance    = maxDistance;
module.exports.shorterThan    = shorterThan;
module.exports.distance       = distance;
module.exports.length         = length;
module.exports.stops          = stops;
module.exports.shortest       = shortest;
module.exports.NO_SUCH_ROUTE  = NO_SUCH_ROUTE;
