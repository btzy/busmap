var svgns="http://www.w3.org/2000/svg";
var drawRouteGraph=function(routeGraph,busStopData){
    var busmap=document.getElementById("busmap");
    while(busmap.firstChild)busmap.removeChild(busmap.firstChild);
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
    var busmap_wrapper=document.getElementById("busmap-wrapper");
    var scalefactor=Math.min(busmap_wrapper.offsetWidth/(max_x-min_x),busmap_wrapper.offsetHeight/(max_y-min_y));
    var edges=[];
    var vertices=[];
    for(var i=0;i<busStopKeys.length;++i){
        var this_stop=busStopKeys[i];
        var vertex=document.createElementNS(svgns,"circle");
        vertex.setAttribute("cx",busStopData[this_stop].x);
        vertex.setAttribute("cy",-busStopData[this_stop].y);
        vertex.setAttribute("r",Math.sqrt((Object.keys(routeGraph[this_stop].busList).length))/scalefactor);
        //vertex.setAttribute("fill","blue");
        vertex.setAttribute("style","fill:blue;stroke-width:0");
        vertices.push(vertex);
        for(var dir=0;dir<2;++dir){
            var tempStopKeys=Object.keys(routeGraph[this_stop].adjStops[dir]);
            for(var j=0;j<tempStopKeys.length;++j){
                var other_stop=tempStopKeys[j].split("&")[0];
                var other_dir=tempStopKeys[j].split("&")[1];
                if(this_stop<other_stop){
                    /*var edge=document.createElementNS(svgns,"line");
                    edge.setAttribute("x1",busStopData[this_stop].x);
                    edge.setAttribute("y1",-busStopData[this_stop].y);
                    edge.setAttribute("x2",busStopData[other_stop].x);
                    edge.setAttribute("y2",-busStopData[other_stop].y);
                    edge.setAttribute("stroke","red");
                    edge.setAttribute("stroke-width",1/scalefactor);
                    busmap.appendChild(edge);*/
                    var edge=document.createElementNS(svgns,"path");
                    var dist=getDistance(busStopData[this_stop],busStopData[other_stop])/2;
                    edge.setAttribute("d","M "+busStopData[this_stop].x+" "+(-busStopData[this_stop].y)+" C "+(dist*Math.cos(busStopData[this_stop].direction+dir*Math.PI)+busStopData[this_stop].x)+" "+(-(dist*Math.sin(busStopData[this_stop].direction+dir*Math.PI)+busStopData[this_stop].y))+", "+(dist*Math.cos(busStopData[other_stop].direction+other_dir*Math.PI)+busStopData[other_stop].x)+" "+(-(dist*Math.sin(busStopData[other_stop].direction+other_dir*Math.PI)+busStopData[other_stop].y))+", "+busStopData[other_stop].x+" "+(-busStopData[other_stop].y));
                    edge.setAttribute("style","stroke:red;fill:transparent;stroke-width:"+Math.sqrt(routeGraph[this_stop].adjStops[dir][tempStopKeys[j]].length)/scalefactor+";");
                    //edge.setAttribute("stroke","red");
                    //edge.setAttribute("fill","transparent");
                    //edge.setAttribute("stroke-width",Math.sqrt(routeGraph[this_stop].adjStops[dir][tempStopKeys[j]].length)/scalefactor);
                    edges.push({weight:routeGraph[this_stop].adjStops[dir][tempStopKeys[j]].length,edge:edge});
                }
            }
        }
    }
    edges.sort(function(a,b){
        return a.weight-b.weight;
    });
    edges.forEach(function(edge){
        busmap.appendChild(edge.edge);
    });
    vertices.forEach(function(vertex){
        busmap.appendChild(vertex);
    });
};