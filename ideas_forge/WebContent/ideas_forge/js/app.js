(function(angular){
"use strict";

//angular'ized extenral dependencies
angular.module('$moment', [])
.factory('$moment', ['$window', function($window) {
  return $window.moment;
}]);

angular.module('ideas-forge', ['$moment', 'ngAnimate', 'ngResource', 'ui.router', 'ui.bootstrap', 'angular-loading-bar'])
.config(['$stateProvider', '$urlRouterProvider', 'cfpLoadingBarProvider', function($stateProvider, $urlRouterProvider, cfpLoadingBarProvider) {

		$urlRouterProvider.otherwise("/");
		
		$stateProvider	
		.state('list', {
			  url: "/",
		      views: {
		      	"@": {
		              templateUrl: 'views/master.html',
		              controller: ['MasterDataService', '$log', 'FilterList', function(MasterDataService, $log, FilterList){
		              
		              	this.list = [];
		              	this.filterList = FilterList;
		              	var self = this;
		              	
						MasterDataService.list()
						.then(function(data){
							self.list = data;
						})
		              	.catch(function(err){
		              		$log.error(err);
		              		throw err;
		              	});
		              }],
		              controllerAs: 'masterVm'
		      	},
		      	"toolbar@": {
		              templateUrl: 'views/toolbar.html',
		              controller: ['FilterList', function(FilterList){
		              	this.filterList = FilterList;
		              }],
		              controllerAs: 'toolbarVm'
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
					controller: ['$stateParams','$log', 'MasterDataService', 'Comment', function($stateParams, $log, MasterDataService, Comment){
						this.comment = {};
						var self = this;
					  	if($stateParams.ideaId && $stateParams.idea)
							this.idea = $stateParams.idea;
						else {
							MasterDataService.get($stateParams.ideaId)
							.then(function(data){
								self.idea = data;
							})
							.catch(function(err){
								throw err;
							});
						}
						
						this.vote = function(vote){
							MasterDataService.vote(self.idea, vote)
							.then(function(data){
								$log.info("voted: " + vote);
								self.idea = data;
							});
						};
						
						this.postComment = function(){
							self.comment.idfc_idfi_id = this.idea.idfi_id;
							var operation = self.comment.idfc_id!==undefined?'update':'save';
							Comment[operation](self.comment).$promise
							.then(function(commentData){
								//TODO: mixin into the resource the id from Location header upon response
								$log.info('Comment with id['+commentData.idfc_id+'] saved');
								return MasterDataService.get($stateParams.ideaId)
										.then(function(data){
											self.idea = data;
										});
							})
							.catch(function(err){
								$log.error(err);
								throw err;
							})
							.finally(function(){
								self.comment = {};
							});
						};
						
						this.replyOpen = function(comment){
							this.comment = comment;
							this.reply = {
								reply_to_idfc_id: comment.idfc_id,
								idfc_idfi_id: self.idea.idfi_id
							};
						};

						this.replyPost = function(){
							var upsertOperation = self.reply.idfc_id===undefined?'save':'update';
							Comment[upsertOperation ](self.reply).$promise
							.then(function(commentData){
								$log.info('reply saved');
								return MasterDataService.get($stateParams.ideaId)
										.then(function(data){
											self.idea = data;
										});
							})
							.catch(function(err){
								throw err;
							})
							.finally(function(){
								delete self.reply;
								self.comment = {};
							});
						};
						this.replyCancel = function(){
							delete self.reply;
							self.comment = {};
						};

					}],
					controllerAs: 'detailsVm'				
				}
			}
		})	
		.state('list.entity.edit', {		    
			views: {
				"@": {
					templateUrl: "views/idea.upsert.html",
					controller: ['$state', '$stateParams', '$log', 'MasterDataService', 'Idea', function($state, $stateParams, $log, MasterDataService, Idea){
							this.idea;
							var self = this;
							if($stateParams.ideaId!==undefined){
							  	if($stateParams.idea)
									this.idea = $stateParams.idea;
								else {
									MasterDataService.get($stateParams.ideaId)
									.then(function(data){
										self.idea = data;
									});								
								}
							}
					  		this.submit = function(){
					  			var upsertOperation = self.idea.idfi_id===undefined?'save':'update';
					  			Idea[upsertOperation](this.idea).$promise
					  			.then(function(data){
					  				$log.info('idea with id['+data.idfi_id+'] saved');
		              				$state.go('list');
					  			})
					  			.catch(function(err){
					  				$log.error('idea could not be saved');
					  				throw err;
					  			});
					  		};
						}],
					controllerAs: 'detailsVm'								
				}
			}
		});
		  
		cfpLoadingBarProvider.includeSpinner = false;
		  
	}])
	.service('FilterList', [function() {
		var _filterText;
	  	return {
	  		filterText: _filterText
	  	};
	}]);
})(angular);
