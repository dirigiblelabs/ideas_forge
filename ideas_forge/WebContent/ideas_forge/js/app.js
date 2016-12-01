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
					controller: ['$state', 'Idea', function($state, Idea){
							this.idea;
					  		this.submit = function(){
					  			Idea.save(this.idea).$promise
					  			.then(function(data){
					  				console.info('idea with id['+data.idfi_id+'] saved');
		              				$state.go('list');
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
					controller: ['$state', '$stateParams','Idea', 'Comment', function($state, $stateParams, Idea, Comment){
						this.comment = {};
						var self = this;
					  	if($stateParams.ideaId && $stateParams.idea)
							this.idea = $stateParams.idea;
						else {
							Idea.get({ideaId: $stateParams.ideaId, expanded:true}).$promise
							.then(function(data){
								self.idea = data;
							})
							.catch(function(err){
								throw err;
							});
						}
						this.postComment = function(){
							self.comment.idfc_idfi_id = this.idea.idfi_id;
							Comment.save(self.comment).$promise
							.then(function(commentData){
								console.info('Comment with id['+commentData.idfc_id+'] saved');
								return Idea.get({ideaId: $stateParams.ideaId, expanded:true}).$promise
								.then(function(ideaData){
									self.idea = ideaData;
								});
							})
							.catch(function(err){
								console.error(err);
								throw err;
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
							Comment.save(self.reply).$promise
							.then(function(){
								$state.go('list.entity', {ideaId: self.idea.idfi_id});
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
