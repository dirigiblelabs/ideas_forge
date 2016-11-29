/* globals $ */
/* eslint-env node, dirigible */
(function(){
"use strict";

var database = require("db/database");

var datasource = database.getDatasource();

var persistentProperties = {
	mandatory: ["idfc_id"],
	optional: ["comment_text", "user", "publish_date"]
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
        var sql = "INSERT INTO IDF_COMMENT (IDFC_ID, IDFC_COMMENT_TEXT, IDFC_USER, IDFC_PUBLISH_DATE)";
        sql += " VALUES (?,?,?,?)";

        var statement = connection.prepareStatement(sql);
        item = createSQLEntity(item);
        
        item.boi_id = datasource.getSequence('IDF_COMMENT_IDFC_ID').next();
        
        var j = 0;
        statement.setInt(++j, item.boi_id);
        statement.setString(++j, item.text);
        statement.setString(++j, item.user);
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
exports.find = function(id) {

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
            if(item)
            	$log.info('IDF_COMMENT entity with id[' + id + '] found');
        }
        
        return item;

    } catch(e) {
		e.errContext = sql;
		throw e;
    } finally {
        connection.close();
    }
};

// Read all entities, parse and return them as an array of JSON objets
exports.list = function(ideaId, limit, offset, sort, order) {

	$log.info('Listing IDF_COMMENT entity collection for IDF_IDEA id [' + ideaId + '] with list operators: limit['+limit+'], offset['+offset+'], sort['+sort+'], order['+order+']');

    var connection = datasource.getConnection();
    try {
        var items = [];
        var sql = "SELECT ";
        if ((limit !== null && limit !== undefined) && (offset !== null && offset !== undefined)) {
            sql += " " + datasource.getPaging().genTopAndStart(limit, offset);
        }
        sql += " * FROM IDF_COMMENT";
        if(ideaId !== null && ideaId !== undefined){
        	sql += " WHERE IDF_ID='" + ideaId+"'";
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
            items.push(createEntity(resultSet));
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
	entity.boi_id = resultSet.getInt("IDFC_ID");
	entity.boi_boh_name = resultSet.getString("IDFC_COMMENT_TEXT");
    entity.boi_name = resultSet.getString("IDFC_USER");
    entity.boi_column = resultSet.getString("IDFC_PUBLISH_DATE");
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
        
        $log.info('IDF_COMMENT entity with idfc_id[' + id + '] updated');
        
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
        
        $log.info('IDF_COMMENT entity with idfc_id[' + id + '] deleted');        
        
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
