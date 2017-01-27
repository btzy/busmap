var getIntersection=function(stop1Data,stop1DirectionIndex,stop2Data,stop2DirectionIndex){
    var x1=stop1Data.x;
    var x2=stop2Data.x;
    var y1=stop1Data.y;
    var y2=stop2Data.y;
    var cos1=Math.cos(stop1Data.direction);
    var cos2=Math.cos(stop2Data.direction);
    var sin1=Math.sin(stop1Data.direction);
    var sin2=Math.sin(stop2Data.direction);
    var denq=cos2*sin1-cos1*sin2;
    var kq=y1*cos2*sin1-y2*cos1*sin2+(x2-x1)*cos1*cos2;
    var kp=x1*sin2*cos1-x2*sin1*cos2+(y2-y1)*sin1*sin2;
    if(Math.abs(denq)<0.000000001)return false;
    return {x:-kp/denq,y:kq/denq};
}

var getJunctionBusStops=function(routeGraph,busStopCode,dirindex,visited,curr_visited){
    if(visited.hasOwnProperty(busStopCode)){
        return false; // this junction has been parsed before; stop this function and return false immediately.
    }
    if(curr_visited.hasOwnProperty(busStopCode)&&curr_visited[busStopCode][dirindex]){
        return []; // has been visited in current iteration, don't visit again.
    }
    if(!curr_visited.hasOwnProperty(busStopCode))curr_visited[busStopCode]=[];
    curr_visited[busStopCode][dirindex]=true; // set this to currently visited.
    var adj_stop_dirs=routeGraph[busStopCode].adjStops[dirindex];
    var stop_dirs_keys=Object.keys(adj_stop_dirs);
    var junction_stop_dirs=[{busStopCode:busStopCode,directionIndex:dirindex}];
    for(var i=0;i<stop_dirs_keys.length;++i){
        var _arr=stop_dirs_keys[i].split("&");
        var nextStopCode=_arr[0];
        var nextStopDir=parseInt(_arr[1],10);
        var returned_stops=getJunctionBusStops(routeGraph,nextStopCode,nextStopDir,visited,curr_visited);
        if(!returned_stops)return false;
        junction_stop_dirs.concat(returned_stops);
    }
    return junction_stop_dirs;
}

var findJunctionGroups=function(routeGraph,mergedBusStopData){
    // finds all junction groups and return them
    // note: termini are also junctions
    // routeGraph={"<mod bus stop code>":{adjStops:[{"<next mod bus stop code>&<dirindex>":["<svc no>"]}],busList:{"<svc no>":{name:<display name>,stopDirections:[<bool, true if bus is travelling to that direction>]}}}}
    // mergedBusStopData={<mergeStopCode>:{x:number,y:number,direction:angle}}
    var junctionGroups=[];
    var busStopKeys=Object.keys(routeGraph);
    var visited={};
    for(var i=0;i<busStopKeys.length;++i){
        // process each stop to find any adj junctions
        for(var dirindex=0;dirindex<2;++dirindex){
            var junctionGroup=getJunctionBusStops(routeGraph,busStopKeys[i],dirindex,visited,{});
            if(junctionGroup&&junctionGroup.length!==2){ // not a single edge.  could be a terminal or normal junction
                junctionGroups.push(junctionGroup);
            }
        }
        visited[busStopKeys[i]]=true;
    }
    return junctionGroups;
    // returns [[{busStopCode,directionIndex}]]
};

var splitJunctionGroups=function(junctionGroups,mergedBusStopData){
    // splits the junction groups if the junction seems too big, and give the coordinates of all junctions
    // TODO this function.  currently, it does not split anything.
    var junctions=[];
    for(var i=0;i<junctionGroups.length;++i){
        var ct=0;
        var ttl_x=0,ttl_y=0;
        for(var j=0;j<junctionGroups[i].length;++j){
            for(var k=j+1;k<junctionGroups[i].length;++k){
                var pt=getIntersection(mergeBusStopData[junctionGroups[i][j].busStopCode],junctionGroups[i][j].directionIndex,mergeBusStopData[junctionGroups[i][k].busStopCode],junctionGroups[i][k].directionIndex);
                if(pt){
                    ttl_x+=pt.x;
                    ttl_y+=pt.y;
                    ++ct;
                }
            }
        }
        if(ct==0){ // no candidates, just use first bus stop location
            ttl_x=mergedBusStopData[junctionGroups[i][0].busStopCode].x;
            ttl_y=mergedBusStopData[junctionGroups[i][0].busStopCode].y;
            ++ct;
        }
        ttl_x/=ct;
        ttl_y/=ct;
        junctions.push({x:ttl_x,y:ttl_y,links:junctionGroups[i],junctionGroupIndex:i}); // note: the stop-dir list is a reference to the old one.
    }
    junctions.sort(function(a,b){
        if(a.junctionGroupIndex<b.junctionGroupIndex)return -1;
        if(a.junctionGroupIndex>b.junctionGroupIndex)return 1;
        return 0;
    });
    return junctions;
    // returns [{x,y,links:[{busStopCode(string/int(adjJunctionIndex)),directionIndex}],junctionGroupIndex}]
};

var generateJunctionGraph=function(routeGraph,junctionData,junctionGroupData){
    // junctionData should be sorted by junctionGroupIndex
    // routeGraph={"<mod bus stop code>":{adjStops:[{"<next mod bus stop code>&<dirindex>":["<svc no>"]}],busList:{"<svc no>":{name:<display name>,stopDirections:[<bool, true if bus is travelling to that direction>]}}}}
    var junctionGraph={junctions:new Array(junctionData.length),edges:[]};
    var junctionGroup=[];
    var stopDirToJunction={};
    
    
    
    var _doJunctionGroup=function(){
        // build empty junctions:
        for(var i=0;i<junctionGroup.length;++i){
            junctionGraph.junctions[junctionGroup[i]]={adjJunctions:[]};
        }
        // draw edges within junction group:
        for(var i=0;i<junctionGroup.length;++i){
            for(var j=0;j<junctionData[junctionGroup[i]].links.length;++j){
                if(typeof junctionData[junctionGroup[i]].links[j].busStopCode === "number"){
                    if(junctionGroup[i]<junctionData[junctionGroup[i]].links[j].busStopCode){
                        // only draw from smaller to bigger junction index
                        _addEmptyEdge(junctionGroup[i],junctionData[junctionGroup[i]].links[j].busStopCode);
                    }
                }
            }
        }
        // draw external edges:
        for(var i=0;i<junctionGroup.length;++i){
            for(var j=0;j<junctionData[junctionGroup[i]].links.length;++j){
                if(typeof junctionData[junctionGroup[i]].links[j].busStopCode === "string"){ // is a real external bus stop
                    // walk to the next junction:
                    var edge={busList:[],busStopList:[]};
                    var busList=routeGraph[junctionData[junctionGroup[i]].links[j].busStopCode].busList;
                    var busKeys=Object.keys(busList);
                    for(var k=0;k<busKeys.length;++k){
                        edge.busList.push({svcNo:busKeys[k],name:busList[busKeys[k]].name});
                    }
                    var curr_stop=junctionData[junctionGroup[i]].links[j].busStopCode;
                    var curr_dir=1-junctionData[junctionGroup[i]].links[j].directionIndex;
                    while(true){
                        var curr_busStop={busStopCode:curr_stop,stopDirections:{}};
                        var curr_busKeys=Object.keys(routeGraph[curr_stop].busList);
                        for(var k=0;k<curr_busKeys.length;++k){
                            curr_busStop.stopDirections[curr_busKeys[k]]=[routeGraph[curr_stop].busList[curr_busKeys[k]].stopDirections[curr_dir],routeGraph[curr_stop].busList[curr_busKeys[k]].stopDirections[1-curr_dir]];
                        }
                        edge.busStopList.push(curr_busStop);
                        if(stopDirToJunction.hasOwnProperty(curr_stop+"&"+curr_dir)){
                            // next stop is a junction
                            if(stopDirToJunction[curr_stop+"&"+curr_dir]>=junctionGroup[i]){ // link from small to larger junction
                                _addEdge(junctionGroup[i],stopDirToJunction[curr_stop+"&"+curr_dir],edge);
                            }
                            break;
                        }
                        else{
                            var _stopdirArr=Object.keys(routeGraph[curr_stop].adjStops[curr_dir])[0].split("&");
                            curr_stop=_stopdirArr[0];
                            curr_dir=parseInt(_stopdirArr[1]);
                        }
                    }
                }
            }
        }
        // draw busLinks and internal edges:
        // TODO the below:
        /*for(var i=0;i<junctionGroup.length;++i){
            for(var j=0;j<junctionData[junctionGroup[i]].links.length;++j){
                if(typeof junctionData[junctionGroup[i]].links[j].busStopCode === "string"){ // is a real external bus stop
                    var busStopCode=junctionData[junctionGroup[i]].links[j].busStopCode;
                    var dirIndex=junctionData[junctionGroup[i]].links[j].directionIndex;
                    var targetsKeys=Object.keys(routeGraph[busStopCode].adjStops[dirIndex]);
                    for(var k=0;k<targetsKeys.length;++k){
                        var svcArr=routeGraph[busStopCode].adjStops[dirIndex][targetsKeys[k]];
                        var targetStopDir=targetKeys[k];
                        var visitedJunctions=[]; // sparse array
                        // do a dfs to find the route to the end:
                        _addRoutes(junctionGroup[i],svcArr,visitedJunctions,targetStopDir.split("&")[0],parseInt(targetStopDir.split("&")[1],10));
                    }
                }
            }
        }*/
        
    };
    var _addEdge=function(j1,j2,edge){
        var edgeIndex=junctionGraph.edges.length;
        junctionGraph.junctions[j1].adjJunctions.push({junctionIndex:j2,edgeIndex:edgeIndex,busLinks:[]});
        junctionGraph.junctions[j2].adjJunctions.push({junctionIndex:j1,edgeIndex:edgeIndex,busLinks:[]});
        junctionGraph.edges.push(edge);
    };
    var _addEmptyEdge=function(j1,j2){
        var edgeIndex=junctionGraph.edges.length;
        junctionGraph.junctions[j1].adjJunctions.push({junctionIndex:j2,edgeIndex:edgeIndex,busLinks:[]});
        junctionGraph.junctions[j2].adjJunctions.push({junctionIndex:j1,edgeIndex:edgeIndex,busLinks:[]});
        junctionGraph.edges.push({busList:[],busStopList:[]});
    };
    var _addRoutes=function(currJunctionIndex,svcArr,visitedJunctions,targetStop,targetDir,prevJunctionIndex){
        if(visitedJunctions[currJunctionIndex])return false;
        visitedJunctions[currJunctionIndex]=true;
        for(var i=0;i<junctionData[currJunctionIndex].links.length;++i){
            // if it's a stop-dir:
            if(typeof junctionData[currJunctionIndex].links[i].busStopCode === "string"){
                if(junctionData[currJunctionIndex].links[i].busStopCode===targetStop&&junctionData[currJunctionIndex].links[i].directionIndex===targetDir){
                    // reached the target!
                    if(typeof prevJunctionIndex === "number"){
                        // draw the link:
                        //_drawBusLink(currJunctionIndex,
                        // TODO.
                    }
                }
            }
        }
    };
    
    
    
    // real start:
    for(var i=0;i<junctionData.length;++i){
        for(var j=0;j<junctionData[i].links.length;++j){
            stopDirToJunction[junctionData[i].links[j].busStopCode+"&"+junctionData[i].links[j].directionIndex]=i;
        }
    }
    for(var i=0;i<junctionData.length;++i){
        junctionGraph.junctions[i]={adjJunctions:[]};
    }
    for(var i=0;i<junctionData.length;++i){
        if(junctionGroup.length&&junctionGroup[0].junctionGroupIndex!==junctionData[i].junctionGroupIndex){
            _doJunctionGroup();
            junctionGroup=[];
        }
        junctionGroup.push(i);
    }
    if(junctionGroup.length)_doJunctionGroup();
    junctionGroup=[];
    
    
    
    // returns {junctions:[<junction index>:{adjJunctions:[{junctionIndex:<junction index>,edgeIndex:<edge index>,busLinks:[<adjJunctionIndex>:["<svcNo>"]]}]}],edges:[<edge index>:{busList:[{svcNo:"<svc no>",name:"<display name>"}],busStopList:[{busStopCode:"<mod bus stop code>",stopDirections:{"<svc no>":[<bool, true if bus is travelling to that direction>]}}]}]};
    // busList: from left to right when looking from smaller junction ID to larger junction ID.
    // busStopList: from smaller junction ID to larger junction ID.
    // stopDirections: index 0: from smaller junction ID to larger junction ID, index 1: from larger junction ID to smaller junction ID
};