'use strict';
var chai   = require('chai');
var expect = chai.expect;
var Routes = require('../lib').Routes;


describe('trains', function () {
  var routes, nodes;

  before(function() {
    routes = new Routes(['AB5', 'BC4', 'CD8', 'DC8', 'DE6', 'AD5', 'CE2', 'EB3', 'AE7']);
    nodes  = routes.nodes;
  });

  it('should calculate the distance from A -> B -> C', function () {
    var distance = routes.distance([nodes.A,nodes.B,nodes.C]);
    expect(distance).to.equal(9);
  });

  it('should calculate the distance from A -> D', function () {
    var distance = routes.distance([nodes.A,nodes.D]);
    expect(distance).to.equal(5);
  });

  it('should calculate the distance from A -> D -> C', function () {
    var distance = routes.distance([nodes.A,nodes.D,nodes.C]);
    expect(distance).to.equal(13);
  });

  it('should calculate the distance from A -> E -> B -> C -> D', function () {
    var distance = routes.distance([nodes.A,nodes.E,nodes.B,nodes.C,nodes.D]);
    expect(distance).to.equal(22);
  });

  it('should find no route from A -> E -> D', function () {
    var distance = routes.distance([nodes.A,nodes.E,nodes.D]);
    expect(distance).to.equal(Routes.NO_SUCH_ROUTE);
  });

  it('should determine the number of routes from C -> C with no more than three stops', function() {
    var numRoutes = routes.countRoutes(routes.nodes['C'], routes.nodes['C'], 3);
    expect(numRoutes).to.equal(2);
  });

  it('should determine the number of routes from A -> C with exactly 4 stops', function() {
    var numRoutes = routes.countRoutesWithStops(routes.nodes['A'], routes.nodes['C'], 4);
    expect(numRoutes).to.equal(1);
  });

  it('should find the distance of the shortest route from A -> C', function() {
    var distance = routes.shortestRoute(routes.nodes['A'], routes.nodes['C']);
    expect(distance).to.equal(9);
  });

  it('should find the distance of the shortest route from B -> B', function() {
    var distance = routes.shortestRoute(routes.nodes['B'], routes.nodes['B']);
    expect(distance).to.equal(9);
  });

  it.skip('should find the number of routes from C -> C with a distance < 30', function() {
    routes.routesLessThan(routes.nodes['C'], routes.nodes['C']);
  });
});
