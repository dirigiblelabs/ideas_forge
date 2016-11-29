(function(angular){
"use strict";

angular.module('ideas-forge', ['ngAnimate', 'ngResource', 'ui.router', 'ui.bootstrap', 'angular-loading-bar'])
.config(['$stateProvider', '$urlRouterProvider', 'cfpLoadingBarProvider', function($stateProvider, $urlRouterProvider, cfpLoadingBarProvider) {

		$urlRouterProvider.otherwise("/");
		
		$stateProvider	
		.state('list', {
			  url: "/",
		      views: {
		      	"@": {
		              templateUrl: 'views/master.html',
		              controller: function(){
		              	this.list = [{
		              		idf_id: 1,
		              		shortText: "idea 1",
		              		description: "description",
		              		tags: ['a', 'b', 'c'],
		              		user: 'Pencho',
		              		publishDate: '10/12/2016',
		              		status: 'Forging',
		              		votesUp: 3,
		              		votesDown: 1,
		              		comments: [{
		              			idfc_id: 1,
		              			user: 'xyz',
		              			text: "cool let's do it",
		              			publishDate: '10/12/2016'
		              		}]
		              	},{
		              		idf_id: 2,
		              		shortText: "idea 2",
		              		description: "description 2",
		              		tags: ['a', 'b', 'c'],
		              		user: 'Tsonyo',
		              		publishDate: '10/12/2016',
		              		status: 'In production',
		              		votesUp: 13,
		              		votesDown: 4,
		              		comments: [{
		              			idfc_id: 2,
		              			user: 'xyz',
		              			text: "cool let's do it",
		              			publishDate: '10/12/2016'
		              		}]
		              	}];
		              },
		              controllerAs: 'masterVm'
		      	}
		      }
		    })
		.state('list.entity', {
			url: "{ideaId}",
			params: {
				idea: undefined
			},
			views: {
				"@": {
					templateUrl: "views/detail.html",				
					controller: ['$stateParams', function($stateParams){
					  	if($stateParams.ideaId)
							this.idea = $stateParams.idea;
						this.newComment = function(){
							console.log('new comment')
						}
					}],
					controllerAs: 'detailsVm'				
				}
			}
		})
		.state('list.entity.upsert', {
			params: {
				idea: undefined
			},
			views: {
				"@": {
					templateUrl: "views/detail.upsert.html",
					controller: ['$stateParams', function($stateParams){
					  	if($stateParams.ideaId)
							this.idea = $stateParams.idea;
						this.upsert = function(){
							console.log('o yeah');
						};
					}],
					controllerAs: 'detailsVm'				
				}
			}			
	   	});
		  
		cfpLoadingBarProvider.includeSpinner = false;
		  
	}])
})(angular);
