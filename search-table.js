angular.module('ukgovsearchtable').directive('searchTable', ['columnsTransformerSrv', 'searchUtilSrv', function (columnsTransformerSrv, searchUtilSrv) {
    'use strict';
    return {
        scope: {
            columns: '=',
            url: '=',
            id: '=',
            emptyResults:'=',
            disableCondition: '=disableCondition',
            defaultSearch: '=defaultSearch',
            displaySearchBox: '=',
            view: '=?',
            serverFilters: '=?'
        },
        template: '<div id="newSearchInput"><input type="text" ng-model="searchQuery" ng-change="searchTable()"/><button class="runSearch" ng-click="searchTable()"/></div><table  datatable="" dt-instance="dtInstanceCallback" dt-columns="ctrl.dtColumnDefs" dt-options="ctrl.dtOptions" class="dataTables_wrapper no-footer row-border hover" style="display: table;width: 100%;"></table>',
        controllerAs: 'ctrl',
        controller:['$rootScope', '$scope', '$compile', 'DTOptionsBuilder',  
                  function($rootScope, $scope, $compile, DTOptionsBuilder){
            var ctrl = this;
            
            ctrl.id = ($scope.id !== undefined && $scope.id !== "") ? $scope.id.replace(/'/g, '') : "tableId";
            ctrl.customClass = "";
            ctrl.dtInstance = {};
            
            ctrl.createdRow = function(row, data, dataIndex) {
                $compile(angular.element(row).contents())($scope);
            };
            
            ctrl.rowCallback =  function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                if ($scope.disableCondition) {
                	if ($scope.disableCondition.condition) {
                		 if(columnsTransformerSrv.condition($scope.disableCondition.condition, aData)){
                             $(nRow).addClass($scope.disableCondition.condition.trueBranch['class']);
                         } else {
                             $(nRow).addClass($scope.disableCondition.condition.falseBranch['class']);
                         }
                	} else if ($scope.disableCondition.switchCase) {
                		for(var i = 0; i < $scope.disableCondition.switchCase.length; i++){
                    		if($scope.disableCondition.switchCase[i].condition){
                    			if(columnsTransformerSrv.condition($scope.disableCondition.switchCase[i].condition, aData)){
                    				$(nRow).addClass($scope.disableCondition.switchCase[i].condition.trueBranch['class']);
                    				break;
                    			}
                    		} else if($scope.disableCondition.switchCase[i]['default']){
                    			$(nRow).addClass($scope.disableCondition.switchCase[i]['default']['class']);
                    			break;
                    		} else {
                    			continue;
                    		}
                    	}
                    	
                	}
                }
            };
            
            ctrl.serviceRequestParams = function (d){
                var data = { draw: d.draw, start: d.start, length: d.length, format: "json", sort: [], columns: [], view: $scope.view, serverFilters: $scope.serverFilters};
                var filter  = searchUtilSrv.createFilter($scope.defaultSearch);         
                
                if (filter !== "") {
                    data.filter = filter;
                }
                
                if (d.search.value !== "") {
                    data.search =  "*" + d.search.value + "*";
                }
                
                for(var i = 0; i < d.order.length; i++){
                	var orderCol = d.columns[d.order[i].column];
                	if(orderCol.orderable){
	                  var orderBy = {
	                      column: orderCol.name.replace(/\^/g, ""),
	                      direction: (d.order[i].dir === 'asc') ? "ascending" : "descending",
	                  };
	                  data.sort.push(orderBy);
	                }
                }
                
                for(i=0; i < d.columns.length; i++){
                    var column = {
                        name: d.columns[i].data
                    };
                    var name = d.columns[i].name;
                    if ( name ) {
                        column.field = name;
                        data.columns.push(column);
                    }
                }
                return JSON.stringify(data);
            };
            
            ctrl.displaySearchBox = function() {
                if ($scope.displaySearchBox !== undefined && $scope.displaySearchBox == "false") {
                    return false;
                } else {
                    return true;
                }
            };
            
            
            ctrl.dtOptions = DTOptionsBuilder.newOptions()
               .withOption('ajax', {
                  url: $scope.url,
                  type: 'POST',
                  data: function(d) {
                      return ctrl.serviceRequestParams(d);
                  },
                  "contentType": "application/json; charset=utf-8",
                  dataType: "json",
                  error: function(xhr, error, thrown) {
                	  $rootScope.$broadcast("ajaxError", ctrl.dtInstance.id);
                	  alert(thrown);
                  }
                })
               .withOption('processing', true)
               .withOption('serverSide', true)
               .withLanguage({"sEmptyTable": $scope.emptyResults }) 
               .withDataProp('data')
               .withPaginationType('full_numbers')
               .withOption('createdRow', ctrl.createdRow)
               .withOption('bFilter', ctrl.displaySearchBox())
               .withOption('responsive', false)
               .withOption('rowCallback', ctrl.rowCallback)
               .withOption('pagingType', 'full_numbers');
            
            for(var i=0; i < $scope.columns.length; i++){
                var column = $scope.columns[i], type = column.esifType;
                columnsTransformerSrv[type](column);
            }
            ctrl.dtColumnDefs = $scope.columns;
            
            $rootScope.$on('reload', function(event, tableId){
            	 $scope.tableInstance.reloadData();
            });
            
            $rootScope.$on('ajaxError', function(event, instanceId){
            	if(ctrl.dtInstance.id === instanceId) {
            		//ctrl.dtInstance.dataTable.addClass("error");
            	}
            });
                        
            $scope.dtInstanceCallback = function(dtInstance)
            {
                var datatableObj = dtInstance;
                $scope.tableInstance = datatableObj;  
                var newInput = dtInstance.dataTable.parent().parent().find('#newSearchInput');
                var oldInput = dtInstance.dataTable.parent().find("label [type=search]").parent();
            	if(oldInput.length > 0) {
            		oldInput.replaceWith(newInput);
            	}
            	else {
            		newInput.remove();
            	}
            };
            
            $scope.searchTable = function()
            {
                var query = $scope.searchQuery;
                $scope.tableInstance.DataTable.search(query).draw();                
            };
        }]
    };    
}]);
