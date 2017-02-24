angular.module('ukgovsearchtable', []);
angular.module('ukgovsearchtable').service('columnsTransformerSrv', ['$http', 'appSpecific', function($http, appSpecific){
	'use strict';

	/*
	 * {
	 * 	 esifType: "link" || "button" || label || undefined || span || currency || checkbox || translate, 
	 *   data :{
	 *   	label:"field" '|| "'label'",
	 *      link: "field",
	 *      condition: {
	 *      	left: "field",
	 *      	operator: 'eq' || "ne" || "gt" || "lt" || "le" || "lt" 
	 *          right: "field",
	 *          trueBranch: {
	 *          
	 *          },
	 *          falseBranch: {
	 *          
	 *          }
	 *      },
	 *      caseSwitch: [
	 *      	{ "condition" : { ... } },
	 *      	{ "condition" : { ... } },
	 *      	{ "default" : {}}
	 *      ],
	 *   }
	 * }
	 */
    var transform = this;
    var labels = {};
    $http.get('/' + appSpecific.getWebAppContext() + '/resources/js/' + appSpecific.getAppName() +  '/angular/labels.json')
         .success(function(data){
        	 labels = data;
         });
    
    
    transform.label = function(column) {
    	var build = column.build;
    	column.render = function (data, type, full, meta ) {
   	   		return transform.build(build, full, transform.createLabel);
    	};
    };
    
    transform.link = function(column){
       var build = column.build;
   	   column.render = function (data, type, full, meta ) {
   	   		return transform.build(build, full, transform.createLink);
   	   };
    };
    
    transform.commentsAndLink = function(column){
        var build = column.build;
    	   column.render = function (data, type, full, meta ) {
    	   		return transform.build(build, full, transform.createCommentsAndLink);
    	   };
     };
     
    transform.button = function(column){
       var build = column.build;
       column.render = function (data, type, full, meta ) {
   	   		return transform.build(build, full, transform.createButton);
       }; 
    };
    
    transform.build = function(buildData, data, action){
    	if(buildData.condition){
     	   	if(transform.condition(buildData.condition, data)){
     	   			return transform.build(buildData.condition.trueBranch, data, action);
     	   	} else {
     	   			return transform.build(buildData.condition.falseBranch, data, action);
     	   	}
   		} else if(buildData.caseSwitch){
   			 	return transform.caseSwitch(buildData.caseSwitch, data, action);
   		} else {
        	return action(buildData, data);
      }
    };
    
    transform.caseSwitch = function(caseSwitch, data, action){
    	var result = "";
    	for(var i = 0; i < caseSwitch.length; i++){
    		if(caseSwitch[i].condition){
    			if(transform.condition(caseSwitch[i].condition, data)){
    				result = transform.build(caseSwitch[i].condition.trueBranch, data, action);
    				break;
    			}
    		} else if(caseSwitch[i]['default']){
    			result = transform.build(caseSwitch[i]['default'], data, action);
    			break;
    		} else {
    			continue;
    		}
    	}
    	return result;
    };
    
    transform.replaceParams = function(replaceable, param, params, data){
    	if(param !== undefined){
    		replaceable = replaceable.replace(/~placeholder~/g, transform.evaluate(param, data));
    	} else if (params !== undefined){
    		for(var i = 0; i < params.length; i++){
    			var regex = new RegExp('~placeholder' + i + '~', 'g');
    			var paramValue = transform.evaluate(params[i], data);
    			var v = "";
    			if(paramValue instanceof Array) {
    			    v = paramValue.join();
    			} else {
    			    v = paramValue;
    			}
    			replaceable = replaceable.replace(regex, v);
    		}
    	}
    	return replaceable;
    };
    
    transform.createLabel = function(linkData, data){
    	var  param = linkData.param, params = linkData.params, label = linkData.label;
    	return transform.replaceParams(label, param, params, data);
    };
    
    transform.createLink = function(linkData, data){
    	var param = linkData.param, params = linkData.params, label = linkData.label, 
    	            link = linkData.link, blank = linkData.blank, labelParam = linkData.labelParam, labelParams = linkData.labelParams;
    	link = transform.replaceParams(link, param, params, data);
    	var linkText = "";
    	if(linkData.linkText !== undefined){
    	    linkText = linkData.linkText;
    	    linkText = transform.replaceParams(linkText, labelParam, labelParams, data);
    	} else {
    	    linkText = transform.evaluate(label, data);
    	}
    	
    	var target = "";
    	if(blank !== undefined && blank){
    		target = "target='_blank'";
    	}

    	return '<a href="' + link + '" ' + target + '>' + linkText + '</a>';
    };
    
    transform.createCommentsAndLink = function(linkData, data){
        var param = linkData.param, params = linkData.params, label = linkData.label, link = linkData.link, blank = linkData.blank, commentsColumn = linkData.comments;
        if(param !== undefined){
        link = link.replace(/~placeholder~/g, transform.evaluate(param, data));
        } else if (params !== undefined){
        for(var i = 0; i < params.length; i++){
        var regex = new RegExp('~placeholder' + i + '~', 'g');
        var paramValue = transform.evaluate(params[i], data);
        var v = "";
        if(paramValue instanceof Array) {
           v = paramValue.join();
        } else {
           if(paramValue === undefined && params[i] === 'form-action'){
               v = 'view';
           } else {
               v = paramValue;
           }
        }
        link = link.replace(regex, v);
        }
        }
        var linkText = "";
        if(linkData.linkText !== undefined){
           linkText = linkData.linkText;
        } else {
           linkText = transform.evaluate(label, data);
        }
       
        var target = "";
        if(blank !== undefined && blank){
        target = "target='_blank'";
        }

        var link =  '<a href="' + link + '" ' + target + '>' + linkText + '</a>';
        var comments = transform.evaluate(commentsColumn, data);
        var commentsValue = '<span>'+ comments +'</span>';
        if(comments === undefined)
        	commentsValue = '';
        
        return '<div>'+link+'<br/>'+commentsValue+'</div>'
     };

    transform.createButton = function(buttonData, data){
    	if(buttonData) {    		
    		if(buttonData.action !== undefined && buttonData.actionParameters !== undefined){
    			var actionParameters = [];
    			for(var i = 0; i < buttonData.actionParameters.length; i++){
    				actionParameters[i] = transform.evaluate(buttonData.actionParameters[i], data);
    			}
    			return '<a href="javascript:void(0)" ' + buttonData.action + ' = ' + actionParameters.join('/') + ' >' 
    			+ transform.evaluate(buttonData.label, data) + '</a>';
    		} if(buttonData.action !== undefined && buttonData.actionParameter !== undefined){
    		    var type = "";
    		    if(buttonData.type !== undefined){
    		        type = "type="+buttonData.type;
    		    }
    			return '<a href="javascript:void(0)" ' + buttonData.action + ' = ' + transform.evaluate(buttonData.actionParameter, data) + ' ' + type + '>'
    			+ transform.evaluate(buttonData.label, data) + '</a>';
    		} if (buttonData.link !== undefined) {
    			return transform.createLink(buttonData, data);
    		} else {
    			return transform.evaluate(buttonData.label, data);
    		}
    	} else {
    		return "";
    	}
    };

    transform.span = function(column){
       var buildData = column.build;
       column.render = function (data, type, full, meta ) {
            return transform.createSpan(buildData, full);
       };

    };

    transform.createSpan = function(buildData, data){
    	if(buildData) {
    		return '<span '+ buildData.directiveName +'>' + transform.evaluate(buildData.field, data) + '</span>';
    	} else {
    		return "";
    	}
    };

    transform.checkbox = function(column){
       var buildData = column.build;
       column.render = function (data, type, full, meta ) {
    	    var selected = "";
    	    if(buildData.selectedField && transform.evaluate(buildData.selectedField, full) == "true" ) {
    	    	selected = 'checked="checked"';
    	    }
    	    
    	    var disable = "";
    	    if (buildData.allDisabled && buildData.allDisabled == 'true') {
    	    	disable = 'disabled="disabled"';
    	    }
    	    if (buildData.disabledField && transform.evaluate(buildData.disabledField, full) == "true") {
    	    		disable = 'disabled="disabled"';
    	    }
    	    
    	    
            return '<input ' + buildData.directiveName + ' type="checkbox" name="'+ buildData.checkboxName +'" value="'+ transform.evaluate(buildData.field, full) +'" '+ selected +' '+disable+'/>';
       };

    };

    transform.undefined = function(column){
    	//do nothing
    };
    
    transform.condition = function(condition, data){
    	 var left = transform.evaluate(condition.left, data), 
	         right = transform.evaluate(condition.right, data);
    	 return transform[condition.operator](left, right);
    };
    
    transform.eq = function(left, right){
    	return left === right;
    };
    
    transform.ne = function(left, right){
    	return left !== right;
    };
    
    transform.empty = function(left, right){
    	//adding toString since some properties may be numbers
    	return left === undefined || left.toString().trim() === ''; 
    };
    
   transform.evaluate = function(expression, data){
    	if(expression && expression !== ""){
	    	if(expression.indexOf("'") ===0 || expression.indexOf("&#039;") === 0){
	    		return expression.replace(/'|&#039;/g, '');
	    	} else {
	    		return transform.getProperty(data, expression);
	    	} 
    	} else {
    		return "";
    	}
    };
    
    transform.getProperty = function(obj, prop){
        var parts = prop.split('.');
        if(parts.length === 1){
        	return obj[prop];
        } else {
	        var last = parts.pop(), l = parts.length, i = 1, current = parts[0];
	        while((obj = obj[current]) && i < l) {
	        	current = parts[i];
	        	i++;
	        }
	        if(obj) {
	        	return obj[last];
	        }
        }
    };
    
    transform.currency = function(column){
    	 column.render = function (data, type, full, meta ) {
    		 var value = Number(transform.evaluate(column.data, full));
    		 return (value).formatMoney();
    	 };
    };
    
    transform.euro = function(column){
   	 column.render = function (data, type, full, meta ) {
   		 var value = Number(transform.evaluate(column.data, full));
   		 
   		 return (value !== "") ? (value).formatMoney("€") : "";
   	 };
   };
    
    transform.translate = function(column){
    	 column.render = function (data, type, full, meta ) {
    		 var value = transform.evaluate(column.data, full);
    		 
    		 if(value !== "" && labels[value]) 
    			 return labels[value];
    		 else if(value !== "")
    			 return value;
    		 else 
    			 return '';
    	 };
    	
    };
    
    transform.claimNo = function(column){
   	 column.render = function(data, type, full, meta) {
   		 var value = transform.evaluate(column.data, full);
   		 return value !== undefined ? value.split("/")[3] : "";
   	 };
   };
    


}]);
