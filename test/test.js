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
    var distance = routes.from(nodes.A).to(nodes.B).to(nodes.C).maxStops(1).find().distance();
    expect(distance).to.equal(9);
  });

  it('should calculate the distance from A -> D', function () {
    var distance = routes.from(nodes.A).to(nodes.D).maxStops(1).find().distance();
    expect(distance).to.equal(5);
  });

  it('should calculate the distance from A -> D -> C', function () {
    var distance = routes.from(nodes.A).to(nodes.D).to(nodes.C).maxStops(1).find().distance();
    expect(distance).to.equal(13);
  });

  it('should calculate the distance from A -> E -> B -> C -> D', function () {
    var distance = routes.from(nodes.A).to(nodes.E).to(nodes.B).to(nodes.C).to(nodes.D).maxStops(1).find().distance();
    expect(distance).to.equal(22);
  });

  it('should find no route from A -> E -> D', function () {
    var distance = routes.from(nodes.A).to(nodes.E).to(nodes.D).maxStops(1).find().distance();
    expect(distance).to.equal(Routes.NO_SUCH_ROUTE);
  });

  it('should determine the number of routes from C -> C with no more than three stops', function() {
    var numRoutes = routes.from(nodes.C).to(nodes.C).maxStops(3).find().length();
    expect(numRoutes).to.equal(2);
  });

  it('should determine the number of routes from A -> C with exactly 4 stops', function() {
    var numRoutes = routes.from(nodes.A).to(nodes.C).maxStops(4).find().stops(4).length();
    expect(numRoutes).to.equal(1);
  });

  it('should find the distance of the shortest route from A -> C', function() {
    var distance = routes.from(nodes.A).to(nodes.C).maxStops(-1).find().shortest();
    expect(distance).to.equal(9);
  });

  it('should find the distance of the shortest route from B -> B', function() {
    var distance = routes.from(nodes.B).to(nodes.B).maxStops(-1).find().shortest();
    expect(distance).to.equal(9);
  });

  it('should find the number of routes from C -> C with a distance < 30', function() {
    var count = routes.from(nodes.C).to(nodes.C).shorterThan(30).find().length();
    expect(count).to.equal(7);
  });
});
