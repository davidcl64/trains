var assert  = require('assert');
var _       = require('lodash/fp');
var debug   = require('debug')('trains');
var Node    = require('./node');
var Edge    = require('./edge');
var api     = require('./api');

// Helper to reverse parameters from _.reduceRight and construct Edge objects
function toGraph(edgeOpts) {
  function createEdge(next, edgeOpts) {
    return new Edge(edgeOpts,next);
  }

  return _.reduceRight(createEdge, null)(edgeOpts);
}

// Split the passed in string on the provided delimiter
function split(delimiter) {
  return function(str) { return str.split(delimiter); }
}

// Mutate the provided array by removing the last entry
function pop(arr) { arr.pop(); }


/*
 * Constructs directed graph based on the provided nodeList.
 *
 * @example
 *
 *     var Routes = require('trains').Routes;
 *     var routes = new Routes(['AB5','AC4','CB2']);
 *
 * @param {array} nodeList An array of three character strings representing the origin node,
 *                         destination node and weight of an edge.
 */
function Routes(nodeList) {
  // Allow constructor to be called as a function
  if(!(this instanceof Routes)) { return new Routes(nodeList); }

  assert(nodeList,                        'nodeList is a required parameter');
  assert(nodeList.constructor === Array,  'nodeList must be an array');

  var nodes = this.nodes = _.flow(
    _.map(split("")),
    _.map(_.tap(pop)),
    _.flatten,
    _.uniq,
    _.map(Node),
    _.keyBy('name')
  )(nodeList);

  var toNode     = function(simpleEdge) { return nodes[simpleEdge]; }
  var toEdgeOpts = _.flow(
    _.zipObject(['origin','destination','weight']),
    _.update('weight',      _.toInteger),
    _.update('origin',      toNode),
    _.update('destination', toNode)
  );

  this.originMap = _.flow(
    _.sortBy(Object),
    _.map(split("")),
    _.map(toEdgeOpts),
    _.groupBy('origin.name'),
    _.mapValues(toGraph)
  )(nodeList);
}

Routes.prototype.constructor = Routes;

/*
 * Initializes a new route with a chainable API.
 *
 * Calls to the resulting API will mutate the state of this route, but will
 * not affect the state of the original Routes object.
 *
 */
Routes.prototype.from = function _from(node) {
  if(_.isString(node)) { node = this.nodes[node]; }

  assert(node, 'from: Bad or missing node argument: ' + node);

  // Generate a stateful API with a reference to the nodes & originMap collections
  return _.flow(
    _.merge(this),
    _.merge({ path: [node], routes: [], visited: {} })
  )(Object.create(api));
};

module.exports = exports = Routes;
module.exports.NO_SUCH_ROUTE = api.NO_SUCH_ROUTE;


