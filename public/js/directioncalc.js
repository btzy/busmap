var createPolyline=function(stringPolyline){
    var ret=new Array(stringPolyline.length);
    for(var i=0;i<stringPolyline.length;++i){
        var arr=stringPolyline[i].split(",");
        ret[i]={x:parseFloat(arr[1]),y:parseFloat(arr[0])};
    }
    return ret;
};

var getMedianFromSortedArray=function(arr){
    return (arr.length%2)?(arr[Math.floor(arr.length/2)]):((arr[arr.length/2-1]+arr[arr.length/2])/2);
}

var getCyclicMedian=function(arr,modulo){
    arr.sort();
    var mindiff=1000000000000;
    var minmedian=0;
    for(var i=0;i<arr.length;++i){
        var t_arr=arr.slice(i,arr.length).concat(arr.slice(0,i).map(function(val){return val+modulo;}));
        var median=getMedianFromSortedArray(t_arr);
        var diff=0;
        for(var j=0;j<t_arr.length;++j){
            diff+=Math.abs(t_arr[j]-median);
        }
        if(diff<mindiff){
            mindiff=diff;
            minmedian=median;
        }
    }
    return minmedian%modulo;
};

var getDistance=function(point1,point2){
    return Math.sqrt(point1*point1+point2*point2);
};

var getDirection=function(point1,point2){
    // returns the non-directed direction [0,PI)
    return (Math.atan2(point1.y-point2.y,point1.x-point2.x)+Math.PI)%Math.PI;
}

var getDirectedDirection=function(point1,point2){
    // returns the directed direction from point1 to point2 [0,2*PI)
    return (Math.atan2(point2.y-point1.y,point2.x-point1.x)+2*Math.PI)%(2*Math.PI);
}

var getClosestPoint=function(point,lineStart,lineEnd){
    // returns the closest point
    var ret;
    if(Math.abs(lineStart.x-lineEnd.x)<Math.abs(lineStart.y-lineEnd.y)){
        var g=(lineStart.x-lineEnd.x)/(lineStart.y-lineEnd.y);
        var xx=(lineStart.x+g*(point.y-lineStart.y)+g*g*point.x)/(g*g+1);
        var yy=g*(point.x-xx)+point.y;
        if(yy>lineStart.y^yy>lineEnd.y)return {x:xx,y:yy};
        return (Math.abs(yy-lineStart.y)<Math.abs(yy-lineEnd.y))?{x:lineStart.x,y:lineStart.y}:{x:lineEnd.x,y:lineEnd.y};
    }
    else{
        var g=(lineStart.y-lineEnd.y)/(lineStart.x-lineEnd.x);
        var yy=(lineStart.y+g*(point.x-lineStart.x)+g*g*point.y)/(g*g+1);
        var xx=g*(point.y-yy)+point.x;
        if(xx>lineStart.x^xx>lineEnd.x)return {x:xx,y:yy};
        return (Math.abs(xx-lineStart.x)<Math.abs(xx-lineEnd.x))?{x:lineStart.x,y:lineStart.y}:{x:lineEnd.x,y:lineEnd.y};
    }
};

var getClosestDirectedDirectionFromPolyline=function(pointCoords,polylineCoordsArray,polylinePriorityIndices,maxPriorityAllowableDistance){
    // returns an angle in radians
    // O(#points)
    
    // this is an optimization
    var closestPointsArray=[],closestIndex=0;
    for(var i=0;i<polylinePriorityIndices.length;++i){
        closestPointsArray.push(getClosestPoint(pointCoords,polylineCoordsArray[polylinePriorityIndices[i]],polylineCoordsArray[polylinePriorityIndices[i]+1]));
    }
    for(var i=1;i<closestPointsArray.length;++i){
        if(getDistance(closestPointsArray[i],pointCoords)+0.000000001<getDistance(closestPointsArray[closestIndex],pointCoords)){
            closestIndex=i;
        }
    }
    // non-optimized version
    if(closestPointsArray.length==0||getDistance(closestPointsArray[closestIndex],pointCoords)>maxPriorityAllowableDistance){
        closestPointsArray=[];
        for(var i=1;i<polylineCoordsArray.length;++i){
            closestPointsArray.push(getClosestPoint(pointCoords,polylineCoordsArray[i-1],polylineCoordsArray[i]));
        }
        closestIndex=0;
        for(var i=0;i<closestPointsArray.length;++i){
            if(getDistance(closestPointsArray[i],pointCoords)+0.000000001<getDistance(closestPointsArray[closestIndex],pointCoords)){
                closestIndex=i;
            }
        }
    }
    var directeddirection;
    if(closestIndex==polylineCoordsArray.length-1||getDistance(closestPointsArray[closestIndex],pointCoords)+0.000000001<getDistance(closestPointsArray[closestIndex+1],pointCoords)){
        // is not a corner
        directeddirection=getDirectedDirection(polylineCoordsArray[closestIndex],polylineCoordsArray[closestIndex+1]);
    }
    else{
        var direction=(getDirection(pointCoords,closestPointsArray[closestIndex])+Math.PI/2)%Math.PI;
        var avgdirecteddirection=getCyclicMedian([getDirectedDirection(polylineCoordsArray[closestIndex],polylineCoordsArray[closestIndex+1]),getDirectedDirection(polylineCoordsArray[closestIndex+1],polylineCoordsArray[closestIndex+2])],2*Math.PI);
        var distdir1=(direction-avgdirecteddirection+2*Math.PI)%(2*Math.PI);
        if(distdir1>Math.PI)distdir1=2*Math.PI-distdir1;
        var distdir2=(direction-avgdirecteddirection+3*Math.PI)%(2*Math.PI);
        if(distdir2>Math.PI)distdir2=2*Math.PI-distdir2;
        if(distdir1<distdir2){
            directeddirection=direction;
        }
        else{
            directeddirection=direction+Math.PI;
        }
    }
    return directeddirection;
};

// the public function:
// it will give each stop a direction (modifies busStops!)
// it will also modify busServices giving each service-stop an associated direction
var calculateAverageDirection=function(busStops,busServices){
    // busStops = {<stopData>:{x:number,y:number}}
    // O(#svc * #stops_per_svc * #line_segments_per_svc + #stops * (#svcs_per_stop)^2)
    // O(~ 300 * 50 * 500 + 5000 * 10^2)
    // This function needs optimization
    var busStopDirectionLists={};
    var busStopKeys=Object.keys(busStops);
    for(var i=0;i<busStopKeys.length;++i){
        busStopDirectionLists[busStopKeys[i]]=[];
    }
    var busServicesKeys=Object.keys(busServices);
    for(var i=0;i<busServicesKeys.length;++i){
        var directionsKeys=Object.keys(busServices[busServicesKeys[i]]);
        for(var j=0;j<directionsKeys.length;++j){
            var dir=busServices[busServicesKeys[i]][directionsKeys[j]];
            var route=createPolyline(dir.route);
            dir.stopDirectedDirections=new Array(dir.stops.length);
            // this is an optimization:
            // 2d array (x,y)
            var routeIndicesByLocation=[];
            var min_x=1000000000000,min_y=1000000000000,max_x=-1000000000000,max_y=-1000000000000;
            for(var k=0;k<route.length;++k){
                min_x=Math.min(min_x,route[k].x);
                max_x=Math.max(max_x,route[k].x);
                min_y=Math.min(min_y,route[k].y);
                max_y=Math.max(max_y,route[k].y);
            }
            var shift_x=(max_x-min_x)/100000;
            var shift_y=(max_y-min_y)/100000;
            var prec=30;
            min_x-=shift_x;
            max_x+=shift_x;
            min_y-=shift_y;
            max_y+=shift_y;
            var shift=Math.max(max_x-min_x,max_y-min_y)/prec;
            //shift_x=(max_x-min_x)/prec;
            //shift_y=(max_y-min_y)/prec;
            for(var k=0;k<route.length-1;++k){
                // insert points;
                min_px=Math.floor((route[k].x-min_x)/shift);
                min_py=Math.floor((route[k].y-min_y)/shift);
                max_px=Math.floor((route[k+1].x-min_x)/shift);
                max_py=Math.floor((route[k+1].y-min_y)/shift);
                if(min_px>max_px){
                    var temp=max_px;
                    max_px=min_px;
                    min_px=temp;
                }
                if(min_py>max_py){
                    var temp=max_py;
                    max_py=min_py;
                    min_py=temp;
                }
                for(var l=min_px;l<=max_px;++l){
                    for(var m=min_py;m<=max_py;++m){
                        // add segment to indexed locations:
                        if(!routeIndicesByLocation[l]){
                            routeIndicesByLocation[l]=[];
                        }
                        if(!routeIndicesByLocation[l][m]){
                            routeIndicesByLocation[l][m]=[];
                        }
                        routeIndicesByLocation[l][m].push(k);
                    }
                }
            }
            // TODO: process nearest chunks first
            for(var k=0;k<dir.stops.length;++k){
                var chunk_x=Math.floor((busStops[dir.stops[k]].x-min_x)/shift);
                var chunk_y=Math.floor((busStops[dir.stops[k]].y-min_y)/shift);
                var priority_indices=[];
                for(var l=chunk_x-1;l<=chunk_x+1;++l){
                    for(var m=chunk_y-1;m<=chunk_y+1;++m){
                        if(l>=0&&m>=0){
                            if(routeIndicesByLocation[l]&&routeIndicesByLocation[l][m]){
                                var priority_temp=routeIndicesByLocation[l][m];
                                for(var n=0;n<priority_temp.length;++n){
                                    if(priority_indices.indexOf(priority_temp[n])===-1){
                                        priority_indices.push(priority_temp[n]);
                                    }
                                }
                            }
                        }
                    }
                }
                var closest_direction=getClosestDirectedDirectionFromPolyline(busStops[dir.stops[k]],route,priority_indices,shift);
                busStopDirectionLists[dir.stops[k]].push(closest_direction%Math.PI);
                dir.stopDirectedDirections[k]=closest_direction;
            }
        }
    }
    for(var i=0;i<busStopKeys.length;++i){
        busStops[busStopKeys[i]].direction=getCyclicMedian(busStopDirectionLists[busStopKeys[i]],Math.PI);
    }
};