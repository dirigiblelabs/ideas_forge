/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var database = require("db/database");
var commentsLib = require("ideas_forge/lib/comment_dao");

var datasource = database.getDatasource();

var itemsEntitySetName = "comments";

var persistentProperties = {
	mandatory: ["idfi_id"],
	optional: ["shortText", "description", "publishDate", "status", "user"]
};

var $log = require("ideas_forge/lib/logger").logger;
$log.ctx = "Idea DAO";

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(entity, cascaded) {

	$log.info('Inserting IDF_IDEA entity cascaded['+cascaded+']');

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		if(propName==='idfi_id')
			continue;//Skip validaiton check for id. It's epxected to be null on insert.
		var propValue = entity[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value in IDF_IDEA entity for insert: ' + propValue);
		}
	}

	if(cascaded === undefined || cascaded === null){
		cascaded = false;
	}

    entity = createSQLEntity(entity);

    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO IDF_IDEA (";
        sql += "IDFI_ID, IDFI_SHORT_TEXT, IDFI_DESCRIPTION, IDFI_USER, IDFI_PUBLISH_DATE, IDFI_STATUS) "; 
        sql += "VALUES (?,?,?,?,?,?)";

        var statement = connection.prepareStatement(sql);
        
        var i = 0;
        entity.idfi_id = datasource.getSequence('IDF_IDEA_IDFI_ID').next();
        statement.setInt(++i,  entity.idfi_id);
        statement.setString(++i, entity.shortText);        
        statement.setString(++i, entity.description);

        //TODO: move to frontend svc
        var user = require("net/http/user");
        entity.user = user.getName();
        
        statement.setString(++i, entity.user);
        
        /* TODO: */
		entity.publish_date = new Date().toString();
        statement.setString(++i, entity.publish_date);

        statement.setString(++i, entity.status);//FIXME: use codes instead        
        
        statement.executeUpdate();

		if(cascaded){
			if(entity[itemsEntitySetName] && entity[itemsEntitySetName].length > 0){
	        	for(var j=0; j<entity[itemsEntitySetName].length; j++){
	        		var item = entity[itemsEntitySetName][j];
	        		item.boi_boh_name = entity.boh_name;
					commentsLib.insert(item);        				
	    		}
	    	}
		}

        $log.info('IDF_IDEA entity inserted with id[' +  entity.idfi_id + ']');

        return entity.idfi_id;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id, expanded) {

	$log.info('Finding IDF_IDEA entity with id[' + id + ']');

	if(id === undefined || id === null){
		throw new Error('Illegal argument for id parameter:' + id);
	}

    var connection = datasource.getConnection();
    try {
        var entity;
        var sql = "SELECT * FROM IDF_IDEA_STATS WHERE " + exports.pkToSQL();
     
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);

        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
        	 entity = createEntity(resultSet);
			if(entity){
            	$log.info('IDF_IDEA_STATS entity with id[' + id + '] found');
				if(expanded !== null && expanded!==undefined){
				   var dependentItemEntities = commentsLib.list(entity.idfi_id, null, null, null, null);
				   if(dependentItemEntities) {
				   	 entity[itemsEntitySetName] = dependentItemEntities;
			   	   }
				}            	
        	}
        } 
        return entity;
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.userVoteForIdea = function(idfi_id, user){

	$log.info('Getting a user['+user+'] vote for IDF_IDEA entity with idfi_id['+idfi_id+']');

	if(idfi_id === undefined || idfi_id === null){
		throw new Error('Illegal argument for idfi_id parameter:' + idfi_id);
	}
	
	if(user === undefined || user === null){
		throw new Error('Illegal argument for user parameter:' + user);
	}	

    var connection = datasource.getConnection();
    var vote = 0;
    try {
        var sql = "SELECT * FROM IDF_IDEA_VOTE WHERE IDFV_IDFI_ID=? AND IDFV_USER=?";
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, idfi_id);
        statement.setString(2, user);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            vote = resultSet.getInt("IDFV_VOTE");
			if(vote!==0){
            	$log.info('Vote for IDF_IDEA entity with with id[' + idfi_id+ '] found');
        	}
        } 
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
	
	return vote;
};

// Read all entities, parse and return them as an array of JSON objets
exports.list = function(limit, offset, sort, order, expanded, entityName) {

	$log.info('Listing IDF_IDEA_STATS entity collection expanded['+expanded+'] with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+'], entityName['+entityName+']');
	
    var connection = datasource.getConnection();
    try {
        var entities = [];
        var sql = "SELECT";
        if (limit !== null && offset !== null) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM IDF_IDEA_STATS";
        if (entityName !== undefined && entityName !== null) {
        	sql += " WHERE IDFI_SHORT_TEXT LIKE '" + entityName + "%%'";
    	}
        if (sort !== undefined && sort !== null) {
            sql += " ORDER BY " + sort;
        }
        if ((sort !== undefined && sort !== null) && (sort !== undefined && order !== null)) {
            sql += " " + order;
        }
        if ((limit !== undefined && limit !== null) && (offset !== undefined && offset !== null)) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }

        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	var entity = createEntity(resultSet);
        	if(expanded !== null && expanded!==undefined){
			   var dependentItemEntities = commentsLib.list(entity.idfi_id, null, null, null, null);
			   if(dependentItemEntities) {
			   	 entity[itemsEntitySetName] = dependentItemEntities;
		   	   }
			}
            entities.push(entity);
        }
        
        $log.info('' + entities.length +' IDF_IDEA_STATS entities found');
        
        return entities;
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet) {
    var entity = {};
	entity.idfi_id = resultSet.getInt("IDFI_ID");
    entity.shortText = resultSet.getString("IDFI_SHORT_TEXT");	
    entity.description = resultSet.getString("IDFI_DESCRIPTION");
    entity.user = resultSet.getString("IDFI_USER");
    entity.publishDate = resultSet.getString("IDFI_PUBLISH_DATE"); 
    entity.status = resultSet.getString("IDFI_STATUS");
    entity.latestPublishDate = resultSet.getString("LATEST_PUBLISH_DATE");    
    entity.repliesCount = resultSet.getInt("REPLIES");  
    entity.participantsCount = resultSet.getInt("PARTICIPANTS");      
    entity.totalVotes = resultSet.getInt("TOTAL_VOTES");    
    entity.rating = resultSet.getInt("RATING");      
	for(var key in Object.keys(entity)){
		if(entity[key] === null)
			entity[key] = undefined;
	}	
	var user = require("net/http/user");
    entity.editable = entity.user === user.getName();
    $log.info("Transformation from DB JSON object finished");
    return entity;
}

exports.voteIdea = function(idfi_id, user, vote){
	console.info("Saving user["+user+"] vote["+vote+"] for idea["+idfi_id+"]");
	if(vote===0 || vote === undefined)
		throw Error('Illegal Argument: vote cannot be 0 or undefined');

	var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO IDF_IDEA_VOTE (";
        sql += "IDFV_ID, IDFV_IDFI_ID, IDFV_USER, IDFV_VOTE) "; 
        sql += "VALUES (?,?,?,?)";

        var statement = connection.prepareStatement(sql);
        
        var i = 0;
        var idfv_id = datasource.getSequence('IDF_IDEA_VOTE_IDFV_ID').next();
        statement.setInt(++i, idfv_id);
        statement.setInt(++i, idfi_id);        
        statement.setString(++i, user);        
        statement.setShort(++i, vote);
	    
	    statement.executeUpdate();
    	
    	$log.info('IDF_IDEA_VOTE entity inserted with id[' +  idfv_id + '] for IDF_IDEA entity with id['+idfi_id+']');

        return idfv_id;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    } 
};

//Prepare a JSON object for insert into DB
function createSQLEntity(entity) {
	var persistentItem = {};
	for(var i=0;i<persistentProperties.mandatory.length;i++){
		persistentItem[persistentProperties.mandatory[i]] = entity[persistentProperties.mandatory[i]];
	}
	for(var i=0;i<persistentProperties.optional.length;i++){
		if(entity[persistentProperties.optional[i]] !== undefined){
			persistentItem[persistentProperties.optional[i]] = entity[persistentProperties.optional[i]];
		} else {
			persistentItem[persistentProperties.optional[i]] = null;
		}
	}	
	$log.info("Transformation to DB JSON object finished");
	return persistentItem;
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(entity) {

	$log.info('Updating IDF_IDEA entity with id[' + entity!==undefined?entity.idfi_id:entity + ']');

	if(entity === undefined || entity === null){
		throw new Error('Illegal argument: entity is ' + entity);
	}	
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		var propValue = entity[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value in IDF_IDEA entity for update: ' + propValue);
		}
	}
	
	entity = createSQLEntity(entity);
	
    var connection = datasource.getConnection();
    try {
    
        var sql = "UPDATE IDF_IDEA";
        sql += " SET IDFI_SHORT_TEXT=?, IDFI_DESCRIPTION=?, IDFI_USER=?, IDFI_PUBLISH_DATE=?, IDFI_STATUS=?, IDFI_VOTES_UP=?, IDFI_VOTES_DOWN=?"; 
        sql += " WHERE IDFI_ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setString(++i, entity.shortText);        
        statement.setString(++i, entity.description);
        statement.setString(++i, entity.user);
        statement.setString(++i, entity.status);
        statement.setString(++i, entity.publishDate);
        statement.setString(++i, entity.status);        
        statement.setInt(++i, entity.votesUp);   
        statement.setInt(++i, entity.votesDown);
        var id = entity.idfi_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
            
        $log.info('IDF_IDEA entity with idfi_id[' + id + '] updated');
        
        return this;
        
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// delete entity by id. Returns the id of the deleted entity.
exports.remove = function(id, cascaded) {

	$log.info('Deleting IDF_IDEA entity with id[' + id + '], cascaded['+cascaded+']');

    var connection = datasource.getConnection();
    try {
    
    	var sql = "DELETE FROM IDF_IDEA";
    	
    	if(id !== null){
    	 	sql += " WHERE " + exports.pkToSQL();
    	 	if(id.constructor === Array){
    	 		sql += "IN ("+id.join(',')+")";
    	 	} else {
    	 		" = "  + id;
    	 	}
		}

        var statement = connection.prepareStatement(sql);
        if(id!==null && id.constructor !== Array){
        	statement.setString(1, id);
        }
        statement.executeUpdate();
        
		if(cascaded===true && id!==null){
			var dependentItems = commentsLib.list(id);
			for(var i = 0; i < dependentItems.length; i++) {
        		commentsLib.remove(dependentItems[i].boi_id);
			}
		}        
        
        $log.info('IDF_IDEA entity with idfi_id[' + id + '] deleted');                
        
        return this;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.count = function() {

	$log.info('Counting IDF_IDEA entities');

    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM IDF_IDEA';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    
    $log.info('' + count + ' IDF_IDEA entities counted');

    return count;
};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'IDFI_ID';
    if (result === 0) {
        throw new Error("There is no primary key");
    } else if(result.length > 1) {
        throw new Error("More than one Primary Key is not supported.");
    }
    return result;
};

exports.getPrimaryKey = function() {
	return exports.getPrimaryKeys()[0].toLowerCase();
};

exports.pkToSQL = function() {
    var pks = exports.getPrimaryKeys();
    return pks[0] + " = ?";
};

})();
