var assert = require('assert');

function Edge(opts, next) {
  ['origin', 'destination', 'weight'].forEach(function(expected) {
    assert(expected in opts, 'You must specify a value for ' + expected);
    this[expected] = opts[expected];
  }.bind(this));

  this.next = next;
}



module.exports = exports = Edge;