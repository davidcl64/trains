var assert  = require('assert');
var _       = require('lodash/fp');
var debug   = require('debug')('trains');
var Node    = require('./node');
var Edge    = require('./edge');
var api     = require('./api');

function toGraph(edgeOpts) {
  function createEdge(next, edgeOpts) {
    return new Edge(edgeOpts,next);
  }

  return _.reduceRight(createEdge, null)(edgeOpts);
}

function split(delimiter) {
  return function(str) { return str.split(delimiter); }
}

function pop(arr) { arr.pop(); }


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


Routes.prototype.from = function _from(node) {
  assert(node, 'from: node is a required parameter');

  return _.flow(
    _.merge(this),
    _.merge({ path: [node], routes: [], visited: {} })
  )(Object.create(api));
};

module.exports = exports = Routes;
module.exports.NO_SUCH_ROUTE = api.NO_SUCH_ROUTE;


