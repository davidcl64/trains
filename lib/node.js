var assert = require('assert');

function Node(name) {
  assert(name, 'Node: Missing required parameter name');

  // Allow constructor to be called as a function
  if(!(this instanceof Node)) { return new Node(name); }

  this.name = name;
}

Node.prototype.constructor = Node;

module.exports = exports = Node;
