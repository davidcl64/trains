var assert  = require('assert');
var _       = require('lodash');
var debug   = require('debug')('trains');
var Node    = require('./node');
var Edge    = require('./edge');

var NO_SUCH_ROUTE = "NO SUCH ROUTE";

function _routeAsString(route) {
  return _(route)
    .map(function(edge) { return edge.origin.name; })
    .tap(function(array) { array.push(route[route.length-1].destination.name); })
    .value()
    .join(' -> ');
}

function debugRoutes(routes) {
  if(debug.enabled) {
    debug('Found routes: %s', routes.length);
    _.forEach(routes, function(route) {
      debug('   route: %j', _routeAsString(route));
    }.bind(this));
  }
}

function maxStops(maxStops) {
  this.find     = finder(maxStops,findRoutesByStops);
  return this;
}

function maxDistance(maxDistance) {
  this.find        = finder(maxDistance, findRoutesWithinDistance);
  return this;
}

function shorterThan(distance) {
  this.find        = finder(distance - 1, findRoutesWithinDistance);
  return this;
}

function to(node) {
  this.path.push(node);
  return this;
}

function finder(max, findFn) {
  return function findRoutes() {
    var nodes     = this.path;
    var stop      = nodes.length - 1;
    var notFound  = false;

    var routes, newRoutes;

    routes = _.reduce(nodes, function(routes, node, idx) {
      if(notFound || idx >= stop) { return routes; }

      newRoutes = findFn.call(this, node, nodes[idx+1], max);
      notFound  = newRoutes.length === 0;
      routes    = notFound ? [] : routes.concat(newRoutes);

      return routes;
    }.bind(this),[]);

    debugRoutes(routes);
    this.routes = routes;
    return this;
  }
}

function distance() {
  if(!this.routes.length) { return NO_SUCH_ROUTE; }

  return _.reduce(this.routes, function(distance, route) {
    return distance + _.sumBy(route, 'weight');
  }.bind(this),0);
}

function length() {
  return this.routes.length ? this.routes.length : NO_SUCH_ROUTE;
}

function stops(stops) {
  this.routes = _.filter(this.routes, {length: stops});
  return this;
}

function shortest() {
  if(!this.routes.length) { return NO_SUCH_ROUTE; }

  return _.min(_.map(this.routes, function(route) {
    return _.sumBy(route, 'weight');
  }));
}

function findRoutesByStops(start, stop, maxStops, depth, curRoute) {
  var routes = [];
  depth    = depth    || 1;
  curRoute = curRoute || [];

  // If the start node doesn't exist, return an empty array - no routes
  if(!this.nodeList[start.name]) { return routes; }

  // Not a candidate route if we've exceeded our stops
  if((maxStops >= 0) && (depth > maxStops)) { return routes; }

  start.visited = true;

  var edge = this.nodeList[start.name];
  while(edge != null) {
    curRoute.push(edge);

    if(edge.destination.name === stop.name) {
      routes.push(curRoute.slice(0));
    } else if(!edge.destination.visited) {
      routes = _.concat(routes, findRoutesByStops.call(this, edge.destination, stop, maxStops, depth + 1, curRoute.slice(0)));
    }

    curRoute.pop();
    edge = edge.next;
  }

  curRoute.pop();
  start.visited = false;
  return routes;
};

function findRoutesWithinDistance(start, stop, maxDistance, distance, curRoute) {
  var routes = [];
  distance = distance || 0;
  curRoute = curRoute || [];

  // If the start node doesn't exist, return an empty array - no routes
  if(!this.nodeList[start.name]) { return routes; }

  var edge = this.nodeList[start.name];
  while(edge != null) {
    curRoute.push(edge);
    distance += edge.weight;

    if(distance <= maxDistance) {
      if(edge.destination.name === stop.name) {
        routes.push(curRoute.slice(0));
      }

      routes = _.concat(routes, findRoutesWithinDistance.call(this, edge.destination, stop, maxDistance, distance, curRoute.slice(0)));
    }

    distance -= curRoute.pop().weight;
    edge = edge.next;
  }

  distance -= (curRoute.pop() || {}).weight || 0;
  start.visited = false;
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
