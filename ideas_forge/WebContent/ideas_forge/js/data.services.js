(function(angular){
"use strict";

	angular.module('ideas-forge')
	.service('ResourceSvcConfiguration', ['$log', function($log) {
	
		return {
			cfg: {
			    save: {
			        method: 'POST',
			        interceptor: {
		                response: function(res) {
		                	var location = res.headers('Location');
		                	if(location){
		                		var id = location.substring(location.lastIndexOf('/')+1);
		                		angular.extend(res.resource, { "idfi_id": id });
	                		} else {
	                			$log.error('Cannot infer id after save operation. HTTP Response Header "Location" is missing: ' + location);
	            			}
	                        return res.resource;
		                }
		            }, 
		            isArray: false
			    },
			    update: {
			        method: 'PUT'
			    }
		    }
		};
	}])
	.service('Idea', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
		var cfg = angular.copy(ResourceSvcConfiguration.cfg);
	  	return $resource('../../js/ideas_forge/svc/idea.js/:ideaId', { ideaId:'@id' }, cfg);
	}])
	.service('IdeaCount', ['$resource', function($resource) {
	  	return $resource('../../js/ideas_forge/svc/idea.js/count', {}, 
	  			{get: {method:'GET', params:{}, isArray:false, ignoreLoadingBar: true}});
	}])	
	.service('IdeaVote', ['$resource', function($resource) {
	  	return $resource('../../js/ideas_forge/svc/idea.js/:ideaId/vote', {ideaId:'@ideaId'}, 
	  			{get: {method:'GET', params:{}, isArray:false, ignoreLoadingBar: true}},
	  			{save: {method:'POST', params:{}, isArray:false, ignoreLoadingBar: true}});
	}])		
	.service('Comment', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	 	return $resource('../../js/ideas_forge/svc/comment.js/:commentId', { commentId:'@id' }, ResourceSvcConfiguration.cfg);
	}])
	.service('MasterDataService', ['Idea', 'IdeaVote', '$moment', function(Idea, IdeaVote, $moment) {
		
		function formatEntity(idea){
			idea.timeSincePublish = $moment(idea.publishDate).fromNow();
  			if(idea.latestPublishDate)
  				idea.timeSinceLatestPublish = $moment(idea.latestPublishDate).fromNow();
  			if(idea.comments){
          		idea.comments = idea.comments.map(function(comment){
	      			comment.timeSincePublish = $moment(comment.publish_date).fromNow();
	      			if(comment.replies){
	      				comment.replies = comment.replies.map(function(reply){
	          				reply.timeSincePublish = $moment(reply.publish_date).fromNow();
	          				return reply;
	          			});
	            	}
	            	return comment;
				});
  			}
  			return idea;
		}
		
		var list = function(){
			return Idea.query({expanded:true}).$promise
          	.then(function(data){
          		return data.map(function(idea){
          			return formatEntity(idea);
          		});
          	});
		};
		var get = function(ideaId){
			return Idea.get({"ideaId": ideaId, "expanded":true}).$promise
			.then(function(idea){
	      		return formatEntity(idea);
			});
		};
		var saveVote = function(idea, v){
			return IdeaVote.save({"ideaId":idea.idfi_id, "vote":v}).$promise
			.then(function(){
	      		return get(idea.idfi_id);
			});
		};
		var getVote = function(idea){
			return IdeaVote.get({"ideaId":idea.idfi_id}).$promise
			.then(function(vote){
	      		return vote;
			});
		};
	 	return {
	 		list: list,
	 		get:get,
	 		getVote: getVote,
	 		saveVote: saveVote
	 	};
	}]);
})(angular);
