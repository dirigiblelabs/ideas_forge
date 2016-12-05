/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var userLib = require("net/http/user");
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
					this.dao.voteIdea(context.pathParams.id, userLib.getName(), entity.vote);
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
	
	Idea.prototype.cfg["{id}/vote"] = {
		"get": {
			consumes: ["application/json"],
			handler: function(context, io){
			    try{
					var vote = this.dao.userVoteForIdea(context.pathParams.id, userLib.getName());
					io.response.setStatus(io.response.OK);
					io.response.println(JSON.stringify({"vote": vote}));
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
