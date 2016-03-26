var assert = require('assert');

function Edge(opts, next) {
  // Allow constructor to be called as a function
  if(!(this instanceof Edge)) { return new Edge(opts, next); }

  ['origin', 'destination', 'weight'].forEach(function(expected) {
    assert(expected in opts, 'You must specify a value for ' + expected);
    this[expected] = opts[expected];
  }.bind(this));

  this.next = next;
}

Edge.prototype.constructor = Edge;

module.exports = exports = Edge;
