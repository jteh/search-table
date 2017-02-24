angular.module('ukgovsearchtable').service('searchUtilSrv',['$http', function($http){
	'use strict';

	/*
	 * {
	 * 	 search:   {
	 * 	 operator : AND | OR | NOT (transform to -) the default is AND
	 *   constraints: [
	 *   	{ 
	 *   		 operator: AND | OR | NOT (transform to -)
	 *   		 constraints:[
	 *   			 {
	 *   			name: status
	 *              value: active
	 *   		  } ]	
	 *   		}
	 *   	}
	 *   ]
	 * }
	 *  
	 * }
	 * 
	 *
	 * 
	 * 
	 */
    var search = this;
    var defaultMainOperator = " AND ";
    var defaultConstraintOperator = " OR "
    var space = " ";
    var startBracket = "(";
    var endBracket = ")";
    var emptyString = "";
    var colon = ":";
    
    search.createFilter = function(filterJson){
    	var filter = emptyString;
    	if(filterJson !== undefined && filterJson.constraints !== undefined && filterJson.constraints.length > 0) {
    		
    		var mainOperator = (filterJson.operator !== undefined) ? search.getOperator(filterJson.operator) : defaultMainOperator
    		angular.forEach(filterJson.constraints, function(data) {
    				if (filter !== emptyString) {
    					filter = filter + mainOperator;
    				} else if (search.isUnaryOperator(filterJson.operator) && filterJson.constraints.length === 1) {
    					filter = filter + mainOperator;
    				}
    				
    				var constraintOperator = (data.operator !== undefined) ? search.getOperator(data.operator) :  defaultConstraintOperator
    				var constraint = emptyString;
    				
    				if(data !== undefined && data.constraints !== undefined && data.constraints.length > 0) {
	    				angular.forEach(data.constraints, function(constraintData) {
	    					if (constraint !== emptyString) {
	    						constraint = constraint + constraintOperator;
	    					} else if (search.isUnaryOperator(data.operator) && data.constraints.length === 1) {
	        					filter = filter + constraintOperator;
	        				}
	    					
	    					constraint = constraint + constraintData.name + colon + '"'+constraintData.value+ '"';
	    				});
    				}
    					
    				filter = filter + startBracket + constraint + endBracket;
    			});
    	}; 
    	return filter;
    }
    
    search.getOperator = function(operator) {
    	if (operator === "NOT") {
    		return " - ";
    	} else {
    		return space + operator + space;
    	}
    }
    
    search.isUnaryOperator = function(operator) {
    	if (operator === "NOT") {
    		return true;
    	} else {
    		return false;
    	}
    }
}]);