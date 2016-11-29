/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";
	
	var arester = require("arestme/arester");

	var commentDAO = require("ideas_forge/lib/comment_dao");
	var Comment = arester.asRestAPI(commentDAO);
	Comment.prototype.logger.ctx = "Comment Svc";
	
	var comment = new Comment(commentDAO);	
	
	(function(comment) {

		var request = require("net/http/request");
		var response = require("net/http/response");
		
		comment.service(request, response);
		
	})(comment);	
	
})();
