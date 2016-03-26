var assert  = require('assert');
var _       = require('lodash');
var debug   = require('debug')('trains');
var Node    = require('./node');
var Edge    = require('./edge');

var NO_SUCH_ROUTE = "NO SUCH ROUTE";

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

Routes.prototype.distance = function _distance(nodes) {
  if(nodes.length < 2) { return 0; }

  var distance = 0, depth = 0;

  // For each origin node
  _.every(nodes.slice(0,-1), function(node, idx) {
    // If the origin node doesn't exist, then no route is possible
    if(!this.nodeList[node.name]) {
      distance = NO_SUCH_ROUTE;
      return false;
    }

    // Don't want to check the destination node
    if(idx === nodes.length - 1) {
      return false;
    }

    var edge = this.nodeList[node.name];
    while(edge !== null) {
      if(edge.destination.name === nodes[idx + 1].name) {
        debug('found route from %s -> %s : %d', edge.origin.name, edge.destination.name, edge.weight);
        distance += edge.weight;
        depth++;
      }
      edge = edge.next;
    }

    // Keep iterating through nodes
    return true;
  }.bind(this));

  // If we didn't get to the final destination, then no route
  // was found
  if(depth != nodes.length - 1) {
    distance = NO_SUCH_ROUTE;
  }

  return distance;
};

Routes.prototype.routeAsString = function _routeAsString(route) {
  return _(route)
    .map(function(edge) { return edge.origin.name; })
    .tap(function(array) { array.push(route[route.length-1].destination.name); })
    .value()
    .join(' -> ');
};

Routes.prototype.countRoutes = function _countRoutes(start, stop, maxStops) {
  var routes = this.findRoutes(start, stop, maxStops);

  debug('Found routes: %s', routes.length);
  if(debug.enabled) {
    _.forEach(routes, function(route) {
      debug('   route: %j', this.routeAsString(route));
    }.bind(this));
  }
  return routes.length ? routes.length : NO_SUCH_ROUTE;
};

Routes.prototype.countRoutesWithStops = function _countRoutesWithStops(start, stop, stops) {
  var routes = this.findRoutes(start, stop, stops);
  return _.filter(routes, {length: stops}).length;
};

Routes.prototype.shortestRoute = function _shortestRoute(start, stop) {
  var routes = this.findRoutes(start, stop, -1);

  if(!routes.length) { return NO_SUCH_ROUTE; }

  return _.sumBy(_.minBy(routes, 'length'), 'weight');
};

Routes.prototype.routesLessThan = function _routesLessThan(start,stop,distance) {
  var routes = this.findRoutes(start, stop, -1);

  if(!routes.length) { return NO_SUCH_ROUTE; }

  return _(routes)
    .filter(function(route) {
      if(debug.enabled) { debug(this.routeAsString(route)); }
      return _.sumBy(route, 'weight') < distance;
    }.bind(this)).value().length;
};

Routes.prototype.findRoutes = function _findRoutes(start, stop, maxStops, depth, curRoute) {
  var routes = [];

  depth    = depth    || 0;
  curRoute = curRoute || [];

  // If the start node doesn't exist, return an empty array - no routes
  if(!this.nodeList[start.name]) { return routes; }

  // Not a candidate route if we've exceeded our stops
  depth++;
  if(maxStops >= 0 && depth > maxStops) { return routes; }

  start.visited = true;

  var edge = this.nodeList[start.name];
  while(edge != null) {
    curRoute.push(edge);

    if(edge.destination.name === stop.name) {
      routes.push(curRoute.slice(0));
    } else if(!edge.destination.visited) {
      routes = _.concat(routes, this.findRoutes(edge.destination, stop, maxStops, depth, curRoute.slice(0)));
      depth--;
    }

    curRoute.pop();
    edge = edge.next;
  }

  curRoute.pop();
  start.visited = false;
  return routes;
};

module.exports = exports = Routes;
module.exports.NO_SUCH_ROUTE = NO_SUCH_ROUTE;
