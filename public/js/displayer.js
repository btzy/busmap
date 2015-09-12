var svgns="http://www.w3.org/2000/svg";
var drawRouteGraph=function(routeGraph,busStopData){
    var busmap=document.getElementById("busmap");
    var min_x=1000000000;
    var max_x=-1000000000;
    var min_y=1000000000;
    var max_y=-1000000000;
    var busStopKeys=Object.keys(busStopData);
    for(var i=0;i<busStopKeys.length;++i){
        min_x=Math.min(min_x,busStopData[busStopKeys[i]].x);
        min_y=Math.min(min_y,busStopData[busStopKeys[i]].y);
        max_x=Math.max(max_x,busStopData[busStopKeys[i]].x);
        max_y=Math.max(max_y,busStopData[busStopKeys[i]].y);
    }
    busmap.setAttribute("viewBox",min_x+" "+(-max_y)+" "+(max_x-min_x)+" "+(max_y-min_y));
    var scalefactor=Math.min(busmap.offsetWidth/(max_x-min_x),busmap.offsetHeight/(max_y-min_y));
    for(var i=0;i<busStopKeys.length;++i){
        var this_stop=busStopKeys[i];
        for(var dir=0;dir<2;++dir){
            var tempStopKeys=Object.keys(routeGraph[busStopKeys[i]].adjStops[dir]);
            for(var j=0;j<tempStopKeys.length;++j){
                var other_stop=tempStopKeys[j].split("&")[0];
                var edge=document.createElementNS(svgns,"line");
                edge.setAttribute("x1",busStopData[this_stop].x);
                edge.setAttribute("y1",-busStopData[this_stop].y);
                edge.setAttribute("x2",busStopData[other_stop].x);
                edge.setAttribute("y2",-busStopData[other_stop].y);
                edge.setAttribute("stroke","red");
                edge.setAttribute("stroke-width",1/scalefactor);
                busmap.appendChild(edge);
            }
        }
    }
};