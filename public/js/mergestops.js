var createMergeStops=function(rawStopData,stopMapping){
    // rawStopData={<rawStopCode>:{x:number,y:number,direction:angle}}
    // stopMapping will be populated with {<rawStopCode>:<mergeStopCode>}
    var mergeStopData={};
    var stops=Object.keys(rawStopData);
    for(var i=0;i<stops.length;++i){
        var merge_code=(stops[i].substr(-1)==="9")?(stops[i].substr(0,4)+"1"):stops[i];
        if(!mergeStopData.hasOwnProperty(merge_code)){
            mergeStopData[merge_code]={x:rawStopData[stops[i]].x,y:rawStopData[stops[i]].y,direction:rawStopData[stops[i]].direction};
        }
        else{
            var other_stop=mergeStopData[merge_code];
            mergeStopData[merge_code]={x:(other_stop.x+rawStopData[stops[i]].x)/2,y:(other_stop.y+rawStopData[stops[i]].y)/2,direction:getCyclicMedian([other_stop.direction,rawStopData[stops[i]].direction],Math.PI)};
        }
        stopMapping[stops[i]]=merge_code;
    }
    return mergeStopData;
    // returns {<mergeStopCode>:{x:number,y:number,direction:angle}}
};

