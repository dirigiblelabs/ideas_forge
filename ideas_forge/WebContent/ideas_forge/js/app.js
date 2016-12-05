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
			resolve: {
				idea: ['$stateParams', 'MasterDataService', function($stateParams, MasterDataService){
					if($stateParams.ideaId && $stateParams.idea){
						return $stateParams.idea;
					} else {
						return MasterDataService.get($stateParams.ideaId)
						.then(function(data){
							return data;
						});
					}
				}]
			},
			views: {
				"@": {
					templateUrl: "views/detail.html",				
					controller: ['$state', '$log', 'MasterDataService', 'idea', function($state, $log, MasterDataService, idea){
						this.idea = idea;
						var self = this;
						$state.go('list.entity.discussion', {ideaId: self.idea.idfi_id, idea:self.idea});  	
						
						this.saveVote = function(vote){
							MasterDataService.saveVote(self.idea, vote)
							.then(function(data){
								self.currentUserVote = vote;
								$log.info("voted: " + self.currentUserVote);
								self.idea = data;
							});
						};
						
						this.getVote = function(){
							MasterDataService.getVote(self.idea)
							.then(function(vote){
								self.currentUserVote = vote;
							});
						};

					}],
					controllerAs: 'detailsVm'				
				}
			}
		})
		.state('list.entity.discussion', {
			views: {
				"@list.entity": {
					templateUrl: "views/discussion.html",				
					controller: ['$stateParams','$log', 'MasterDataService', 'Comment', 'idea', function($stateParams, $log, MasterDataService, Comment, idea){
						
						this.comment = {};
						this.idea = idea;
						var self = this;
					  	
					  	this.openCommentForEdit = function(comment){
					  		self.comment = comment;
					  		self.commentEdit = true;
					  		if(self.replyEdit)
					  			self.replyCancel();
					  	};
					  	
					  	this.cancelCommentEdit = function(){
					  		self.comment = {};
					  		self.commentEdit = false;
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
								self.cancelCommentEdit();
							});
						};
						
						this.replyOpen = function(comment, reply){
							self.comment = comment;
							self.replyEdit = true;
							self.reply = reply || {
								reply_to_idfc_id: comment.idfc_id,
								idfc_idfi_id: self.idea.idfi_id
							};
						};

						this.replyCancel = function(){
							delete self.reply;
							self.replyEdit = false;
							if(!self.commentEdit && self.comment.idfc_id!==undefined)
								self.cancelCommentEdit();
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
								self.replyCancel();
							});
						};

					}],
					controllerAs: 'vm'				
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
	}])
})(angular);
