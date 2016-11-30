/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var database = require("db/database");

var datasource = database.getDatasource();

var persistentProperties = {
	mandatory: ["idfc_id", "idfc_idfi_id"],
	optional: ["text", "user", "publish_date", "reply_to_idfc_id"]
};

var $log = require("ideas_forge/lib/logger").logger;
$log.ctx = "Comment DAO";

// Parse JSON entity into SQL and insert in db. Returns the new record id.
exports.insert = function(item) {
	
	$log.info('Inserting IDF_COMMENT entity');
	
	if(item === undefined || item === null){
		throw new Error('Illegal argument: entity is ' + item);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		if(propName==='idfc_id')
			continue;//Skip validaiton check for id. It's epxected to be null on insert.
		var propValue = item[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal ' + propName + ' attribute value: ' + propValue);
		}
	}
	
    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO IDF_COMMENT (IDFC_ID, IDFC_IDFI_ID, IDFC_REPLY_TO_IDFC_ID, IDFC_COMMENT_TEXT, IDFC_USER, IDFC_PUBLISH_DATE)";
        sql += " VALUES (?,?,?,?,?,?)";

        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);
        
        item.idfc_id = datasource.getSequence('IDF_COMMENT_IDFC_ID').next();

        var j = 0;
        statement.setInt(++j, item.idfc_id);
        statement.setInt(++j, item.idfc_idfi_id);
        statement.setInt(++j, item.reply_to_idfc_id);
        statement.setString(++j, item.text);
        
        //TODO: move to frontend svc
        var user = require("net/http/user");
        item.user = user.getName();
        
        statement.setString(++j, item.user);
        
        /* TODO: */
        item.publishDate = new Date().toString();
        statement.setString(++j, item.publishDate);

        statement.executeUpdate();
        
        $log.info('IDF_COMMENT entity inserted with idfc_id[' + item.idfc_id + ']');
        
        return item.idfc_id;
        
    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Reads a single entity by id, parsed into JSON object 
exports.find = function(id, expanded) {

	$log.info('Finding IDF_COMMENT entity with id[' + id + ']');

    var connection = datasource.getConnection();
    try {
        var item;
        var sql = "SELECT * FROM IDF_COMMENT WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        
        var resultSet = statement.executeQuery();
        if (resultSet.next()) {
            item = createEntity(resultSet);
            if(item){
            	$log.info('IDF_COMMENT entity with id[' + id + '] found');
            	if(expanded){
            		item.comments = exports.findComments(item.idfc_idfi_id, expanded);
            	}            	
        	}
        }
        
        return item;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.findComments = function(ideaId, expanded) {

	$log.info('Finding IDF_COMMENT entities in reply to IDF_IDEA entity with id[' + ideaId + ']');

    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT * FROM IDF_COMMENT WHERE IDFC_IDFI_ID=?";
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, ideaId);
        
        var resultSet = statement.executeQuery();
		while (resultSet.next()) {
			var item = createEntity(resultSet);
            items.push(item);
            if(expanded){
            	item.replies = exports.findReplies(ideaId, item.idfc_id);
            }
        }
        
        $log.info('' + items.length +' IDF_COMMENT entities in reply to IDF_IDEA entity with id['+ideaId+'] found');
        
        return items;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

exports.findReplies = function(ideaId, commentId) {

	$log.info('Finding IDF_COMMENT entities in reply to IDF_COMMENT entity with id[' + commentId + '] for IDF_IDEA entity with id['+ideaId+']');

    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT * FROM IDF_COMMENT WHERE IDFC_IDFI_ID=? AND IDFC_REPLY_TO_IDFC_ID=?";
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, ideaId);
        statement.setInt(2, commentId);
        
        var resultSet = statement.executeQuery();
		while (resultSet.next()) {
            items.push(createEntity(resultSet));
        }
        
        $log.info('' + items.length +'  IDF_COMMENT entities in reply to IDF_COMMENT entity with id[' + commentId + '] for IDF_IDEA entity with id['+ideaId+'] found');
        
        return items;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};


// Read all entities, parse and return them as an array of JSON objets
exports.list = function(ideaId, limit, offset, sort, order, expanded) {

	$log.info('Listing IDF_COMMENT entity collection for IDF_IDEA id [' + ideaId + '] with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+'], expanded['+expanded+']');

    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT ";
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM IDF_COMMENT";
        if(ideaId !== null && ideaId !== undefined){
        	sql += " WHERE IDFC_IDFI_ID=" + ideaId;
        }
        if (sort !== null && sort !== undefined) {
            sql += " ORDER BY " + sort;
        }
        if ((sort !== null && sort !== undefined) && (order !== null && order !== undefined)) {
            sql += " " + order;
        }
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genLimitAndOffset(limit, offset);
        }

        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	var item = createEntity(resultSet);
        	item.replies = exports.findReplies(item.idfc_idfi_id, item.idfc_id);
            items.push(item);
        }
        
        $log.info('' + items.length +' IDF_COMMENT entities found');
        
        return items;
        
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
	entity.idfc_id = resultSet.getInt("IDFC_ID");
	entity.text = resultSet.getString("IDFC_COMMENT_TEXT");
	entity.idfc_idfi_id = resultSet.getString("IDFC_IDFI_ID");
    entity.user = resultSet.getString("IDFC_USER");
    entity.reply_to_idfc_id = resultSet.getString("IDFC_IDFI_ID");
    if(entity.reply_to_idfc_id < 0){
    	entity.reply_to_idfc_id = undefined;
    }
    entity.publish_date = resultSet.getString("IDFC_PUBLISH_DATE");
    $log.info("Transformation from DB JSON object finished");
    return entity;
}

//Prepare a JSON object for insert into DB
function createSQLEntity(item) {
	var persistentItem = {};
	for(var i=0;i<persistentProperties.mandatory.length;i++){
		persistentItem[persistentProperties.mandatory[i]] = item[persistentProperties.mandatory[i]];
	}
	for(var i=0;i<persistentProperties.optional.length;i++){
		if(item[persistentProperties.optional[i]] !== undefined){
			persistentItem[persistentProperties.optional[i]] = item[persistentProperties.optional[i]];
		} else {
			persistentItem[persistentProperties.optional[i]] = null;
		}
	}
	if(persistentItem.reply_to_idfc_id === null){
    	persistentItem.reply_to_idfc_id = -1;
    }
	$log.info("Transformation to DB JSON object finished");
	return persistentItem;
}

// update entity from a JSON object. Returns the id of the updated entity.
exports.update = function(item) {

	$log.info('Updating IDF_COMMENT entity with id[' + item!==undefined?item.idfc_id:item + ']');

	if(item === undefined || item === null){
		throw new Error('Illegal argument: entity is ' + item);
	}
	
	for(var i = 0; i< persistentProperties.mandatory.length; i++){
		var propName = persistentProperties.mandatory[i];
		var propValue = item[propName];
		if(propValue === undefined || propValue === null){
			throw new Error('Illegal value for property ' + propName + '[' + propValue +'] in IDF_COMMENT for update ' + item);
		}
	}

    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE IDF_COMMENT SET IDFC_COMMENT_TEXT = ?, IDFC_PUBLISH_DATE = ?, IDFC_USER = ?";
        sql += " WHERE IDFC_ID = ?";
        
        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);

        var i = 0;
        statement.setString(++i, item.text);
        statement.setString(++i, item.publishDate);
        statement.setString(++i, item.user);
        var id = item.idfc_id;
        statement.setInt(++i, id);
        statement.executeUpdate();
        
        $log.info('IDF_COMMENT entity with id[' + id + '] updated');
        
        return this;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// delete entity by id. Returns the id of the deleted entity.
exports.remove = function(id) {

	$log.info('Deleting IDF_COMMENT entity with id[' + id + ']');
	
	if(id === undefined || id === null){
		throw new Error('Illegal argument: id[' + id + ']');
	}	

    var connection = datasource.getConnection();
    try {
    	var sql = "DELETE FROM IDF_COMMENT WHERE " + exports.pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, id);
        statement.executeUpdate();
        
        $log.info('IDF_COMMENT entity with id[' + id + '] deleted');        
        
        return this;
        
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};


exports.count = function() {

	$log.info('Counting IDF_COMMENT entities');

    var count = 0;
    var connection = datasource.getConnection();
    try {
    	var sql = 'SELECT COUNT(*) FROM IDF_COMMENT';
        var statement = connection.prepareStatement(sql);
        var rs = statement.executeQuery();
        if (rs.next()) {
            count = rs.getInt(1);
        }
    }  catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
    
    $log.info('' + count + ' IDF_COMMENT entities counted');         
    
    return count;
};

exports.getPrimaryKeys = function() {
    var result = [];
    var i = 0;
    result[i++] = 'IDFC_ID';
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
