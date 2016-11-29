/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var arester = require("arestme/arester");

	var ideaDAO = require("ideas_forge/lib/idea_dao");
	var Idea = arester.asRestAPI(ideaDAO);
	Idea.prototype.logger.ctx = "Idea Svc";
	
	var idea = new Idea(ideaDAO);	
	
	(function(idea) {

		var request = require("net/http/request");
		var response = require("net/http/response");
		
		idea.service(request, response);
		
	})(idea);	
	
})();