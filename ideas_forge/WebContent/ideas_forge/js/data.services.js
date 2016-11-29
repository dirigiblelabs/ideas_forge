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
		                		angular.extend(res.resource, { "ideaId": id });
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
	  	return $resource('../../js/ideas_forge/svc/ideas.js/:ideaId', { ideaId:'@id' }, cfg);
	}])
	.service('ideaCount', ['$resource', function($resource) {
	  	return $resource('../../js/ideas_forge/svc/ideas.js/count', {}, 
	  			{get: {method:'GET', params:{}, isArray:false, ignoreLoadingBar: true}});
	}])	
/*	.service('EntityQueryByName', ['$resource', function($resource) {
	  	return $resource('../../js/bizon/svc/v1/header.js', {}, {
	  		queryByName: {
	  			method:'GET', 
	  			isArray:true, 
	  			ignoreLoadingBar: true
  			}
	  	});
	}])	*/
	.service('Comment', ['$resource', 'ResourceSvcConfiguration', function($resource, ResourceSvcConfiguration) {
	 	return $resource('../../js/ideas_forge/svc/comment.js/:commentId', { commentId:'@id' }, ResourceSvcConfiguration.cfg);
	}]);
})(angular);