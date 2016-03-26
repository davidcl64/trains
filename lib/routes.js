var assert  = require('assert');
var _       = require('lodash');
var debug   = require('debug')('trains');
var Node    = require('./node');
var Edge    = require('./edge');
var api     = require('./api');

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


Routes.prototype.from = function _from(node) {
  var api = require('./api');

  return _.merge(Object.create(api), this, { path: [node], routes: [] });
};

module.exports = exports = Routes;
module.exports.NO_SUCH_ROUTE = NO_SUCH_ROUTE;
