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
		              controller: ['Idea', function(Idea){
		              	/*this.list = [{
		              		idf_id: 1,
		              		shortText: "idea 1",
		              		description: "My corporate network works with a PAC script.(http://proxyconf.xxx.yy-ss/proxy.pac).Using the PAC script in the \"git config\" command does not work. \"git config --global http.proxy http://proxyconf.xxx.yy-ss/proxy.pac\" I got it to work by downloading the proxy.pac script (100 odd entries), selecting the most generic (usually the bottom most) proxy, and using it with my credentials in the \"git config --global http.proxy\" command.I have already asked about making git work through a proxy server: Getting git to work with a proxy server How do I pull from a Git repository through an HTTP proxy? but the above questions make no mention of PAC scripts. Is there some setting with which I can directly use the proxy.pac script?",
		              		tags: ['a', 'b', 'c'],
		              		user: 'Pencho',
		              		publishDate: '10/12/2016',
		              		status: 'Forging',
		              		votesUp: 3,
		              		votesDown: 1,
		              		comments: [{
		              			idfc_id: 1,
		              			user: 'Stamat',
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
		              			user: 'Radka',
		              			text: "cool let's do it",
		              			publishDate: '10/12/2016'
		              		}]
		              	}];*/
		              	
		              	this.list = [];
		              	var self = this;
		              	
		              	Idea.query({expanded:true}).$promise
		              	.then(function(data){
		              		self.list = data;
		              	})
		              	.catch(function(err){
		              		console.error(err);
		              		throw err;
		              	});
		              }],
		              controllerAs: 'masterVm'
		      	}
		      }
		    })
		.state('list.new', {		    
			views: {
				"@": {
					templateUrl: "views/comment.upsert.html",
					controller: ['Idea', function(Idea){
							this.idea;
					  		this.submit = function(){
					  			Idea.save(this.idea).$promise
					  			.then(function(data){
					  				console.log('idea saved');
					  			})
					  			.catch(function(err){
					  				console.error('idea could not be saved');
					  				throw err;
					  			});
					  		};
						}],
					controllerAs: 'detailsVm'								
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
					controller: ['$stateParams','Comment', function($stateParams, Comment){
					  	if($stateParams.ideaId)
							this.idea = $stateParams.idea;
						this.comment;
						var self = this;
						this.postComment = function(){
							self.comment.idfc_idfi_id = this.idea.idf_id;
							Comment.save(self.comment).$promise
							.then(function(data){
								console.log('new comment saved');	
							})
							.catch(function(err){
								console.error(err);
								throw err;
							});
						};

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
