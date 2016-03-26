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

function Routes(nodeList) {
  assert(nodeList,                        'nodeList is a required parameter');
  assert(nodeList.constructor === Array,  'nodeList must be an array');

  this.nodes    = {};
  this.nodeList = _(nodeList)
    .sort()
    .map(function(node) {
      var edgeOpts = _.zipObject(['origin', 'destination', 'weight'], node.split(''));
        edgeOpts.origin      = this.nodes[edgeOpts.origin]      = this.nodes[edgeOpts.origin]       || new Node(edgeOpts.origin);
        edgeOpts.destination = this.nodes[edgeOpts.destination] = this.nodes[edgeOpts.destination]  || new Node(edgeOpts.destination);
        edgeOpts.weight      = +edgeOpts.weight;

        return edgeOpts;
      }.bind(this))
    .groupBy(function(edgeOpts) { return edgeOpts.origin.name; })
    .mapValues(function(edges) {
      return _.reduceRight(edges, function(next, edgeOpts) {
        return new Edge(edgeOpts,next);
      },null)
    })
    .value();
}

Routes.prototype.constructor = Routes;

Routes.prototype.routeAsString = _routeAsString;

Routes.prototype.distance = function __distance(nodes) {
  var stop = nodes.length - 1;
  var routes;

  return _.reduce(nodes, function(distance, node, idx) {
    if(idx >= stop)           { return distance; }
    if(_.isString(distance))  { return distance; }

    routes = this.findRoutes(node, nodes[idx+1], 1);

    if(routes.length === 0) { return NO_SUCH_ROUTE; }

    debugRoutes(routes);

    return distance + routes[0][0].weight;
  }.bind(this),0);
};

Routes.prototype.countRoutes = function _countRoutes(start, stop, maxStops) {
  var routes = this.findRoutes(start, stop, maxStops);

  debugRoutes(routes);
  return routes.length ? routes.length : NO_SUCH_ROUTE;
};

Routes.prototype.countRoutesWithStops = function _countRoutesWithStops(start, stop, stops) {
  var routes = this.findRoutes(start, stop, stops);
  return _.filter(routes, {length: stops}).length;
};

Routes.prototype.shortestRoute = function _shortestRoute(start, stop) {
  var routes = this.findRoutes(start, stop, -1);

  if(!routes.length) { return NO_SUCH_ROUTE; }

  debugRoutes(routes);
  return _.min(_.map(routes, function(route) {
    return _.sumBy(route, 'weight');
  }));
};

Routes.prototype.routesLessThan = function _routesLessThan(start,stop,distance) {
  var routes = this.findRoutesWithinDistance(start, stop, distance - 1);

  if(!routes.length) { return NO_SUCH_ROUTE; }

  debugRoutes(routes);
  return routes.length;
};

Routes.prototype.findRoutes = function _findRoutes(start, stop, maxStops, depth, curRoute) {
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
      routes = _.concat(routes, this.findRoutes(edge.destination, stop, maxStops, depth + 1, curRoute.slice(0)));
    }

    curRoute.pop();
    edge = edge.next;
  }

  curRoute.pop();
  start.visited = false;
  return routes;
};

Routes.prototype.findRoutesWithinDistance = function _findRoutesWithinDistance(start, stop, maxDistance, distance, curRoute) {
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

      routes = _.concat(routes, this.findRoutesWithinDistance(edge.destination, stop, maxDistance, distance, curRoute.slice(0)));
    }

    distance -= curRoute.pop().weight;
    edge = edge.next;
  }

  distance -= (curRoute.pop() || {}).weight || 0;
  start.visited = false;
  return routes;
};


module.exports = exports = Routes;
module.exports.NO_SUCH_ROUTE = NO_SUCH_ROUTE;
