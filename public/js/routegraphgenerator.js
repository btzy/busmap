var getDirectionIndex=function(currDirectedDirection,refDirection){
    var diffdir1=(refDirection-currDirectedDirection+2*Math.PI)%(2*Math.PI);
    if(diffdir1>=Math.PI)diffdir1=2*Math.PI-diffdir1;
    var diffdir2=(refDirection-currDirectedDirection+3*Math.PI)%(2*Math.PI);
    if(diffdir2>=Math.PI)diffdir2=2*Math.PI-diffdir2;
    if(diffdir1<diffdir2){
        return 0;
    }
    else return 1;
};

var drawRouteGraphEdge=function(routeGraph,svcNo,stop1Code,stop1DirIndex,stop2Code,stop2DirIndex){
    // stop1DirIndex = direction on stop 1 towards stop 2.
    if(!routeGraph[stop1Code].adjStops[stop1DirIndex].hasOwnProperty(stop2Code+"&"+stop2DirIndex)){
        // there is no link from stop1 to stop2
        routeGraph[stop1Code].adjStops[stop1DirIndex][stop2Code+"&"+stop2DirIndex]=[];
    }
    routeGraph[stop1Code].adjStops[stop1DirIndex][stop2Code+"&"+stop2DirIndex].push(svcNo);
    if(!routeGraph[stop2Code].adjStops[stop2DirIndex].hasOwnProperty(stop1Code+"&"+stop1DirIndex)){
        // there is no link from stop2 to stop1
        routeGraph[stop2Code].adjStops[stop2DirIndex][stop1Code+"&"+stop1DirIndex]=[];
    }
    routeGraph[stop2Code].adjStops[stop2DirIndex][stop1Code+"&"+stop1DirIndex].push(svcNo);
};

var appendRouteGraphStop=function(routeGraph,svcNo,stopCode,stopDirIndex){
    if(!routeGraph[stopCode].busList.hasOwnProperty(svcNo)){
        routeGraph[stopCode].busList[svcNo]={name:svcNo,stopDirections:[false,false]};
    }
    routeGraph[stopCode].busList[svcNo].stopDirections[stopDirIndex]=true;
};

var generateRouteGraph=function(busStops,busServices,mergeMapping){
    // busStops = {<mergeStopCode>:{x:number,y:number,direction:angle}}
    // busServices = rawBusServiceData with stopDirectedDirections
    // requires functions from directioncalc.js
    // dir0:[0,Math.PI)
    // dir1:[Math.PI,2*Math.PI)
    
    var routeGraph={};
    // initialize empty busStops in routeGraph:
    var busStopKeys=Object.keys(busStops);
    for(var i=0;i<busStopKeys.length;++i){
        routeGraph[busStopKeys[i]]={adjStops:[{},{}],busList:{}};
    }
    // add all the busServicesDirections:
    var busServicesKeys=Object.keys(busServices);
    for(var i=0;i<busServicesKeys.length;++i){
        var directionsKeys=Object.keys(busServices[busServicesKeys[i]]);
        for(var j=0;j<directionsKeys.length;++j){
            var dir=busServices[busServicesKeys[i]][directionsKeys[j]];
            // read each route-direction
            var prev_dir_index;
            var prev_bus_stop;
            for(var k=0;k<dir.stopDirectedDirections.length;++k){
                var mergedStopCode=mergeMapping[dir.stops[k]];
                var direction_index=getDirectionIndex(dir.stopDirectedDirections[k],busStops[mergedStopCode].direction);
                appendRouteGraphStop(routeGraph,busServicesKeys[i],mergedStopCode,direction_index);
                if(k>0){
                    drawRouteGraphEdge(routeGraph,busServicesKeys[i],prev_bus_stop,prev_dir_index,mergedStopCode,1-direction_index);
                }
                prev_dir_index=direction_index;
                prev_bus_stop=mergedStopCode;
            }
        }
    }
    return routeGraph;
    
    
    // routeGraph={"<mod bus stop code>":{adjStops:[{"<next mod bus stop code>&<dirindex>":["<svc no>"]}],busList:{"<svc no>":{name:<display name>,stopDirections:[<bool, true if bus is travelling to that direction>]}}}}
    // note: there will always be exactly 2 directions per bus stop.
    // note: stop_directions direction is the direction the bus will head to.
};