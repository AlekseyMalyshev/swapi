var app = angular.module('app', ["ui.router"])


app.controller("residentCtrl", ['$scope', '$stateParams', 'starWars', function($scope, $stateParams, starWars) {

  $scope.back = 'page({num: ' + starWars.getCurrPage() + '})';

  starWars.getResident($stateParams.id, function(err, character) {
    if (err) {
      console.error(err.status);
    }
    else {
      $scope.character = character;
    }
  });
}])


app.controller("planetCtrl", ['$scope', '$stateParams', 'starWars', function($scope, $stateParams, starWars) {
  $scope.planets = [];
  $scope.pages = [];

  function updatePages() {
    $scope.prev = function() {
      var prev = 1 === starWars.getCurrPage() ?
        starWars.getCurrPage() : starWars.getCurrPage() - 1
      return 'page({num: ' + prev + '})';
    }

    $scope.next = function() {
      var next = starWars.getPageCount() === starWars.getCurrPage() ?
        starWars.getCurrPage() : starWars.getCurrPage() + 1
      return 'page({num: ' + next + '})';
    }

    var pages = [];
    for (var i = 1; i <= starWars.getPageCount(); ++i) {
      pages.push({
        state: 'page({num: ' + i + '})',
        num: i,
        class: i === starWars.getCurrPage() ? 'active' : ''
      });
    }
    $scope.pages = pages;
  }

  updatePages();

  var page = Number($stateParams.num ? $stateParams.num : 1);

  starWars.getPlanets(page, function(err, planets) {
    if (err) {
      console.error(err.status);
    }
    else {
      $scope.planets = planets;
      updatePages();
    }
  });
}]);


app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/planets")

  $stateProvider
    .state('home', {
      url: "",
    })
    .state('planets', {
      url: "/planets",
      templateUrl: "partials/planets.html",
      controller: "planetCtrl"
    })
    .state('page', {
      url: "/page/:num",
      templateUrl: "partials/planets.html",
      controller: "planetCtrl"
    })
    .state('resident', {
      url: "/resident/:id",
      templateUrl: "partials/resident.html",
      controller: "residentCtrl"
    });
}]);

app.service('starWars', ['$http', function($http) {
  // list of planets returned by the API
  this.pages = [];
  this.pageCount = 0;
  // reversed list of residents
  this.residents = {};

  this.currPage = 1;

  this.getPageCount = function() {
    return this.pageCount;
  }

  this.getCurrPage = function() {
    return this.currPage;
  }

  this.getPlanets = function(page, cb) {
    this.currPage = page;
    if (this.pages[page]) {
      // already got it
      cb(null, this.pages[page]);
    }
    else {
      self = this;
      $http.get("http://swapi.co/api/planets/?page=" + page + "&format=json").then(function(resp) {
          self.pages[page] = resp.data.results.map(function(planet) {
            planet.residents = planet.residents.map(function(resident) {
              var resident = {
                url: resident
              };
              resident.id = resident.url.match(/\d+/)[0];
              self.residents[resident.id] = resident;
              return resident;
            });
            return planet;
          });
          self.pageCount = Math.ceil(resp.data.count / 10); // assume ten planets per page
          cb(null, self.pages[page]);
        },
        function(err) {
          cb(err);
        });
    }
  }

  this.getResident = function(id, cb) {
    var resident = this.residents[id];
    if (resident.character) {
      // already got it
      cb(null, resident.character);
    }
    else {
      $http.get("http://swapi.co/api/people/" + id + "/?format=json").then(function(resp) {
          resident.character = resp.data;
          cb(null, resident.character);
        },
        function(err) {
          cb(err);
        });
    }
  }
}]);

