/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var arester = require("arestme/arester");

	var ideaDAO = require("ideas_forge/lib/idea_dao");
	var Idea = arester.asRestAPI(ideaDAO);
	Idea.prototype.logger.ctx = "Idea Svc";
	
	Idea.prototype.cfg["{id}/vote"] = {
		"post": {
			consumes: ["application/json"],
			handler: function(context, io){
				var input = io.request.readInputText();
			    var entity = JSON.parse(input);
			    try{
			    	var user = require("net/http/user");
					this.dao.voteIdea(context.pathParams.id, user.getName(), entity.vote);
					io.response.setStatus(io.response.OK);
				} catch(e) {
		    	    var errorCode = io.response.INTERNAL_SERVER_ERROR;
		    	    this.logger.error(errorCode, e.message, e.errContext);
		        	this.sendError(io, errorCode, errorCode, e.message, e.errContext);
		        	throw e;
				}		
			}
		}
	};
	
	var idea = new Idea(ideaDAO);	
	
	(function(idea) {

		var request = require("net/http/request");
		var response = require("net/http/response");
		
		idea.service(request, response);
		
	})(idea);	
	
})();
