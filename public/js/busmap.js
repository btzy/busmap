var data_url="https://busrouter-sg.s3-ap-southeast-1.amazonaws.com/v2/";
$(document).ready(function(){
    var updateStatus=function(message){
        //$("body").text(message);
    };
    var getData=function(key,callback){
        var data=(localStorage)?(localStorage.getItem(key)):null;
        if(data)setTimeout(function(){
            callback(JSON.parse(LZString.decompress(data)));
        },0);
        else $.get(data_url+key,{},function(data){
            localStorage.setItem(key,LZString.compress(JSON.stringify(data)));
            callback(data);
        },"json");
    };
    var _forEachVal=function(obj,callback){
        if(obj instanceof Array){
            for(i=0;i<obj.length;++i){
                callback(obj[i]);
            }
        }
        for(var item in obj){
            if(obj.hasOwnProperty(item)){
                callback(obj[item]);
            }
        }
    }
    var _forEach=function(obj,callback){
        if(obj instanceof Array){
            for(i=0;i<obj.length;++i){
                callback(i,obj[i]);
            }
        }
        for(var item in obj){
            if(obj.hasOwnProperty(item)){
                callback(item,obj[item]);
            }
        }
    }
    var rawBusServicesData={};
    var rawBusStopData=[];
    
    var normalizedBusStopData;
    var mergedBusStopData;
    
    var mergedBusStopMapping={};
    
    var routeGraph;
    // routeGraph={"<mod bus stop code>":{adjStops:[{"<next mod bus stop code>&<dirindex>":["<svc no>"]}],busList:{"<svc no>":{name:<display name>,stopDirections:[<bool, true if bus is travelling to that direction>]}}}}
    // note: stop_directions direction is the direction the bus will head to.
    
    var dataInitialized=function(){
        // rawBusServicesData and rawBusStopData should be initialized.
        
        // Convert the downloaded data to {<stopCode>:{x:number,y:number}}
        normalizedBusStopData=normalizeStops(rawBusStopData);
        
        // Calculate the average direction so bus stops will be {<stopCode>:{x:number,y:number,direction:angle}}
        // this function needs optimization.
        calculateAverageDirection(normalizedBusStopData,rawBusServicesData);
        
        // Merge raw stops to combined stops, generating the mapping too:
        mergedBusStopData=createMergeStops(normalizedBusStopData,mergedBusStopMapping);
        
        // Generate the route graph:
        routeGraph=generateRouteGraph(mergedBusStopData,rawBusServicesData,mergedBusStopMapping);
        
        
        
        //debugging visualization of route graph:
        drawRouteGraph(routeGraph,mergedBusStopData);
        
        
        
        
        // parsing algorithm:
        /*_forEachVal(rawBusStopData,function(stopData){
            modBusStopCodes[stopData.no]="FF";
        });
        // merge stops and populate stop list
        _forEach(modBusStopCodes,function(stopCode,modCode){
            if(modCode==="FF"){
                mergedGraph[modCode]={adjStops:[],busList:{}};
                modBusStopCodes[stopCode]=stopCode;
                if(stopCode.substr(-1)==="1"&&modBusStopCodes.hasOwnProperty(stopCode.substr(0,4)+"9"))modBusStopCodes[stopCode.substr(0,4)+"9"]=stopCode;
                else if(stopCode.substr(-1)==="9"&&modBusStopCodes.hasOwnProperty(stopCode.substr(0,4)+"1"))modBusStopCodes[stopCode.substr(0,4)+"1"]=stopCode;
            }
        });*/
        // populate service data
        /*_forEach(rawBusServicesData,function(svcNo,svcData){
            _forEachVal(svcData,function(svcDirData){
                var prev_stop=null;
                var prev_direction=null;
                _forEachVal(svcDirData.stops,function(busStop){
                    // try add bus svc to stop
                    /*if(!mergedGraph[busStop].busList.hasOwnProperty(svcNo)){
                        mergedGraph[busStop].busList[svcNo]={name:svcNo,stop_directions=[]};
                    }
                    if(prev_stop){
                        // link to previous stop:
                        // TODO: guess stop directions for termini
                        // try add adj stop:
                        if(!mergedGraph[prev_stop].adjStops[prev_direction].hasOwnProperty(busStop)){
                            mergedGraph[prev_stop].adjStops[prev_direction][busStop]=[];
                        }
                        // try add edge from previous:
                        if(mergedGraph[prev_stop].adjStops[prev_direction][busStop].indexOf(svcNo)===-1){
                            mergedGraph[prev_stop].adjStops[prev_direction][busStop].push(svcNo);
                        }
                        // try add prev stop:
                        var curr_direction_to_prev=null;
                        _forEach(mergedGraph[busStop].adjStops,function(direction,stopsData){
                            if(!stopsData.hasOwnProperty(prev_stop)){
                                stopsData[prev_stop]=[];
                            }
                            
                        });
                        // try add edge to previous:
                        _forEach(mergedGraph[busStop].adjStops,function(direction,stopsData){
                            if(stopsData[prev_stop].indexOf(svcNo)!==-1){
                                
                                services.push(svcNo);
                            }
                        });
                        mergedGraph[prev_stop].busList[svcNo].stop_directions
                    }
                    prev_stop=busStop;
                });
            });
        });*/
    };
    var _dataCounter=0;
    getData("bus-services.json",function(data){
        var __datact=0;
        var g_data=data;
        for(var i=0;i<data.services.length;++i){
            (function(svc){
                getData("bus-services/"+svc+".json",function(data){
                    updateStatus("Downloaded "+svc);
                    rawBusServicesData[svc]=data;
                    ++__datact;
                    if(__datact==g_data.services.length){
                        ++_dataCounter;
                        if(_dataCounter==2){
                            var handler=function(){
                                document.removeEventListener("click",handler,false);
                                dataInitialized();
                            }
                            document.addEventListener("click",handler,false);
                        }
                    }
                });
            })(g_data.services[i].no);
        }
    });
    getData("bus-stops.json",function(data){
        rawBusStopData=data;
        ++_dataCounter;
        if(_dataCounter==2){
            dataInitialized();
        }
    });
});