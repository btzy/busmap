var normalizeStops=function(rawBusStops){
    // rawStopData=[{no:<stopCode>,lat:"number",lng:"number"}]
    var stopData={};
    for(var i=0;i<rawBusStops.length;++i){
        stopData[rawBusStops[i].no]={x:parseFloat(rawBusStops[i].lng),y:parseFloat(rawBusStops[i].lat)};
    }
    return stopData;
    // returns {<stopData>:{x:number,y:number}}
}