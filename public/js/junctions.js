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
            ttl_x=mergeBusStopData[junctionGroups[i][j].busStopCode].x;
            ttl_y=mergeBusStopData[junctionGroups[i][j].busStopCode].y;
            ++ct;
        }
        ttl_x/=ct;
        ttl_y/=ct;
        junctions.push({x:ttl_x,y:ttl_y,links:junctionGroups[i]}); // note: the stop-dir list is a reference to the old one.
    }
    // returns [{x,y,links:[{busStopCode,directionIndex}]}]
};

var generateJunctionGraph=function(routeGraph,junctionData){
    
    // returns {junctions:[<junction index>:{adjJunctions(sparse array):[<junction index>:<edge index>]}],edges:[<edge index>:{busList:[{svcNo:"<svc no>",name:"<display name>"}],busStopList:[{busStopCode:"<mod bus stop code>",stopDirections:{"<svc no>":[<bool, true if bus is travelling to that direction>]}}]}]};
    // busList: from left to right when looking from smaller junction ID to larger junction ID.
    // busStopList: from smaller junction ID to larger junction ID.
    // stopDirections: index 0: from smaller junction ID to larger junction ID, index 1: from larger junction ID to smaller junction ID
};