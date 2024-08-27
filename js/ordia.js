namespaces=[
	"http://www.wikidata.org/entity/",
	"http://www.wikidata.org/prop/direct/"
]

function removeNameSpaces(str){
	for(ns in nemaspaces){
		str=str.replaceAll(ns,"")
	}
	return str
}

// http://stackoverflow.com/questions/1026069/
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function applyPropertyMapping(thequery,propertyMapping){
	for(key in propertyMapping){
		thequery=thequery.replace(key,propertyMapping[key]["replacement"])
	}
	return thequery
}

function detectCorrectParameter(url){
	if(url.startsWith("Q") && url.includes("signlist")){
		return "?tp="+url.replaceAll("/","")
	}else if(url.startsWith("Q")){
		return "?q="+url.replaceAll("/","")
	}
	if(url.startsWith("L") && url.includes("-F")){
		newurl=url.replaceAll("/","")
		return "?l="+newurl.substring(0,newurl.lastIndexOf('-'))+"&f="+newurl.substring(newurl.lastIndexOf('-')+1)
	}
	if(url.startsWith("L") && url.includes("-S")){
		newurl=url.replaceAll("/","")
		return "?l="+newurl.substring(0,newurl.lastIndexOf('-'))+"&s="+newurl.substring(newurl.lastIndexOf('-')+1)
	}
	if(url.startsWith("L")){
		return "?l="+url.replaceAll("/","")
	}
	if(url.startsWith("P")){
		return "?p="+url.replaceAll("/","")
	}
	return url
}

function addParamsToLink(url,key,linkParams,label=""){
	if(key in linkParams){
		url+=linkParams[key]
	}
	url+="&qLabel="+label
	return url
}

function extendColumnsFromCombinedCols(data,columns,sepchar){
	newcols=[]
	for(col of columns){
		if(!col.includes("cols")){
			newcols.push(col)
		}else{
			aggcols={}
			for (var i = 0 ; i < data.length ; i++) {
				if(col in data[i]){
					//console.log(col)
					//console.log(data[i])
					splitted=data[i][col].split(sepchar)
					//console.log(splitted)
					for(var j=0;j<splitted.length;j+=2){
						if(splitted[j]!="" && !(isNumeric(splitted[j])) && !(splitted[j].length!=3 && splitted[j].includes("LAK"))){
							aggcols[splitted[j]]=true
						}
					}
					//console.log(aggcols)
				}
			}
			
			for(agcol of Object.keys(aggcols).sort()){
				newcols.push(agcol)
			}
		}
		
	}
	return newcols
}

function isNumeric(value) {
    return /^-?\d+$/.test(value);
}

function convertDataTableData(data, columns, linkPrefixes={},linkParams={}) {
    // Handle 'Label' columns.
	sepchar="###"
    // var linkPrefixes = (options && options.linkPrefixes) || {};
    columns=extendColumnsFromCombinedCols(data,columns,sepchar)
    var convertedData = [];
    var convertedColumns = [];
    for (var i = 0 ; i < columns.length ; i++) {
	column = columns[i];
	if (column.substr(-11) == 'Description') {
	    convertedColumns.push('description');
	} else if (column.substr(-5) == 'Label') {
	    // pass
	} else if (column.substr(-6) == 'Label2') {
	    // pass
	} else if (column.substr(-10) == 'image_link') {
	    // pass
	} else if (column.substr(-3) == 'Url') {
	    // pass
	} else {
	    convertedColumns.push(column);
	}
    }
    for (var i = 0 ; i < data.length ; i++) {
	var convertedRow = {};
	//console.log("H: "+h)
	for (var key in data[i]) {
		if(key.includes("_cols")){
			splitted=data[i][key].split("###")
			for(var j=0;j<splitted.length;j+=2){
				if(splitted[j] in convertedRow){
					convertedRow[splitted[j]]=convertedRow[splitted[j]]+" / "+splitted[j+1]
				}else{
					convertedRow[splitted[j]]=splitted[j+1]				
				}
			}
		}
	    if (key.substr(-11) == 'Description') {
		convertedRow['description'] = data[i][key];

	    } else if (key.substr(-5) == 'image') {
			linkarray=[]
			if(key+"_link" in data[i]){
				linkarray=[data[i][key+"_link"]]
				if(data[i][key+"_link"].includes(" ")){
					linkarray=data[i][key+"_link"].split(" ")
				}
			}
			//console.log(key+" "+linkarray)
			if(data[i][key].includes(" ")){
				colval=""
				counter=0
				for(item of data[i][key].split(" ")){
					//console.log(counter+" "+linkarray.length)
					if(counter<linkarray.length){
						colval+='<a target="_blank"'
						if(typeof(h)!=="undefined" && linkarray[counter].includes(h)){
							colval+=' style="color:red"'
						}
						colval+=' href="'+linkarray[counter]+'"><img loading="lazy" src="' + item.replace("http:","https:") + '" height="50"></a>&nbsp;'
					}else{
						colval+='<img loading="lazy" src="' + item.replace("http:","https:") + '" height="50">&nbsp;'
					}
					counter+=1
				}
				convertedRow[key]=colval
			}else{
				if(linkarray.length==1){
					colval='<a target="_blank"'
					if(typeof(h)!=="undefined" && linkarray[0].includes(h)){
						colval+=' style="color:red"'
					}
					convertedRow[key] = colval+' href="'+linkarray[0]+'"><img loading="lazy" src="' + data[i][key].replace("http:","https:") + '" height="50"></a>';
				}else{
					convertedRow[key] = '<img loading="lazy" src="' + data[i][key].replace("http:","https:") + '" height="50">';
				}
							
			}
	    } else if (key + 'Label' in data[i]) {
			var linkcount = (data[i][key].match(/http|\.\.\//g) || []).length;
			sepchar=" // "
			//console.log(data[i][key])
			//console.log(linkcount)
			if(linkcount==0){
				convertedRow[key] = '<span>' + data[i][key + 'Label'] +((key+'Label2' in data[i])?" "+data[i][key+'Label2']:"")+ '</span>';
			}else if(linkcount==1){
				temp = '<a href="' +
				(linkPrefixes[key] || "") + 
				addParamsToLink(detectCorrectParameter(data[i][key].replace("http://www.wikidata.org/entity/","").replace("http://www.wikidata.org/prop/direct/","")),key,linkParams,data[i][key+'Label']+((key+'Label2' in data[i])?" "+data[i][key+'Label2']:"")) +'"'
				if(typeof(h)!=="undefined" && data[i][key].includes(h)){
					temp+=' style="color:red"'
				}
				temp+='>' + data[i][key + 'Label'] +((key+'Label2' in data[i])?" "+data[i][key+'Label2']:"")+ '</a>';
				convertedRow[key]=temp
			}else if(linkcount>1){
				//console.log(data[i][key])
				//console.log(linkcount)
				sepchar=" // "
				try{
					if(data[i][key].includes("http")){
						secondocc=data[i][key].indexOf("http",7)
						if(data[i][key].includes(" # ")){
							secondocccomp=data[i][key].indexOf(" # ")+1
							if(secondocccomp<secondocc){
								secondocc=secondocccomp
							}
						}
					}else if(data[i][key].includes("../")){
						secondocc=data[i][key].indexOf("../",3)
					}else{
						secondocc=data[i][key].indexOf(" ")
					}
					firsturl=data[i][key].substring(0,secondocc)
					var onlyNumbers = firsturl.replace(/\D/g,'');
					var lastNumber = onlyNumbers.substring(onlyNumbers.length - 1);
					var lastNumberIndex=firsturl.lastIndexOf(lastNumber)
					sepchar=data[i][key].substring(lastNumberIndex+1,secondocc)
					//console.log("found new sepchar: |"+sepchar+"| ("+sepchar.length+") | "+onlyNumbers+" ["+lastNumberIndex+" "+secondocc+"] "+firsturl+" | "+onlyNumbers+"\n"+data[i][key])
				}catch(err){
					console.log("ERROR: "+err)
				}
				urls=data[i][key].split(sepchar)
				labs=data[i][key+'Label'].split(sepchar)	
				res=""
				for(let i = 0; i < urls.length; i++){
					res+='<a target="_blank"'
					if(typeof(h)!=="undefined" && urls[i].includes(h)){
						res+=' style="color:red"'
					}
					res+=" href=\""+urls[i]+"\">"+labs[i]+"</a> "+sepchar+" "
				}
				res=res.substring(0,res.length-sepchar.length-2)
				convertedRow[key]=res
			}
	    } else if (key.substr(-5) == 'Label') {
		// pass
		
	    } else if (key.substr(-6) == 'image_link') {
		// pass
		
	    }else if (key.substr(-6) == 'Label2') {
		// pass
		
	    } else if (key + 'Url' in data[i]) {
			if (data[i][key + 'Url']) {
				var linkcount = (data[i][key + 'Url'].match(/http|\.\.\//g) || []).length;
				sepchar=" // "
				//console.log(data[i][key + 'Url'])
				//console.log(linkcount)
				if(linkcount==1){
					temp = '<a target="_blank\"'
					if(typeof(h)!=="undefined" && data[i][key + 'Url'].includes(h)){
						temp+=' style="color:red"'
					}
					temp+=' href="' +(linkPrefixes[key] || "")+ data[i][key + 'Url'] +'">' + data[i][key] + '</a>';
					convertedRow[key]=temp
				}else if(linkcount>1){
					//console.log(data[i][key + 'Url'])
					//console.log(linkcount)
					sepchar=" // "
					urls=data[i][key + 'Url'].split(sepchar)
					labs=data[i][key].split(sepchar)	
					res=""
					for(let i = 0; i < urls.length; i++){
						res+='<a target="_blank"'
						if(typeof(h)!=="undefined" && urls[i].includes(h)){
							res+=' style="color:red"'
						}
						res+=" href=\""+urls[i]+"\">"+labs[i]+"</a> "+sepchar+" "
					}
					//console.log("THERES: "+res)
					res=res.substring(0,res.length-sepchar.length-2)
					convertedRow[key]=res	
				}				
			}
			else {
				// If the URL is empty we do not create a link
				convertedRow[key] = data[i][key];
			}
	    } else if (key.substr(-3) == 'Url') {
		// pass

	    } else if (key.substr(-3) == 'url') {
		// Convert URL to a link
		convertedRow[key] = "<a href='" +
		    data[i][key] + "'>" + 
		    $("<div>").text(data[i][key]).html() + '</a>';

	    } else {
		convertedRow[key] = data[i][key];
	    }
	}
	convertedData.push(convertedRow);
    }
    return {data: convertedData, columns: convertedColumns}
}

function toggleFullScreen(elementid) {
  if (!document.fullscreenElement) {
    document.getElementById(elementid).requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function entityToLabel(entity, language='en') {
    if (language in entity['labels']) {
        return entity['labels'][language].value;
    }

    // Fallback
    languages = ['en', 'da', 'de', 'es', 'fr', 'jp',
                 'nl', 'no', 'ru', 'sv', 'zh'];
    for (lang in languages) {
        if (lang in entity['labels']) {
            return entity['labels'][lang].value;
        }
    }

    // Last resort
    return entity['id']
}


function sparqlDataToSimpleData(response) {
    // Convert long JSON data from from SPARQL endpoint to short form
    let data = response.results.bindings;
    let columns = response.head.vars
    var convertedData = [];
    for (var i = 0 ; i < data.length ; i++) {
	var convertedRow = {};
	for (var key in data[i]) {
	    convertedRow[key] = data[i][key]['value'];
	}
	convertedData.push(convertedRow);
    }
    return {data: convertedData, columns: columns};
}


function sparqlToDataTable(sparql, element, options={}) {
    // Options: linkPrefixes={}, paging=true
    var divElem = (typeof options.divElem === 'undefined') ? "" : options.divElem;
    var linkPrefixes = (typeof options.linkPrefixes === 'undefined') ? {} : options.linkPrefixes;
	var linkParams = (typeof options.linkParams === 'undefined') ? {} : options.linkParams;
    var paging = (typeof options.paging === 'undefined') ? true : options.paging;
    var sDom = (typeof options.sDom === 'undefined') ? 'lfrtip' : options.sDom;
	var pBar = (typeof options.pBar === 'undefined') ? '' : options.pBar;
	var pBarLabel = (typeof options.pBarLabel === 'undefined') ? '' : options.pBarLabel;
	var sepcharmap=(typeof options.sepcharmap === 'undefined') ? {} : options.sepcharmap;
	if(pBar!=""){
		$('#'+pBar).progressbar({
		  value: false
		});	
	}
	var usepropertyMapping=false
	if(usepropertyMapping){
		propertyMapping={
		"wdt:":{"label":"Namespace","replacement":""},
		"P2348":{"label":"timeperiod","replacement":""},
		"P11957":{"label":"Gottstein code","replacement":""},
		"P31":{"label":"instance of","replacement":""},
		"P18":{"label":"image","replacement":""},
		"P282":{"label":"writing system","replacement":""},
		"P180":{"label":"depicts","replacement":""},
		"P1343":{"label":"described by source","replacement":""},
		"P5323":{"label":"attested in","replacement":""},
		"P12436":{"label":"phonetic value","replacement":""},
		"P527":{"label":"has parts","replacement":""},
		"P7421":{"label":"line","replacement":""},
		"P304":{"label":"page","replacement":""},
		"P1810":{"label":"subject named as","replacement":""},
		"P854":{"label":"reference URL","replacement":""},
		"P478":{"label":"volume","replacement":""},
		"P5920":{"label":"root","replacement":""},
		"P5137":{"label":"item for this sense","replacement":""},
		"P9970":{"label":"predicate for","replacement":""},
		"P5972":{"label":"translation","replacement":""}
		}
		sparql=applyPropertyMapping(sparql,propertyMapping)
	}
	
    var post_url = "https://query.wikidata.org/sparql";
    var post_data = "query=" + encodeURIComponent(sparql) + '&format=json'

    
    $.post(post_url, post_data, function(response) {
	var simpleData = sparqlDataToSimpleData(response);

	convertedData = convertDataTableData(simpleData.data, simpleData.columns, linkPrefixes=linkPrefixes,linkParams=linkParams);
	console.log(convertedData)
	if(convertedData.data.length==0 && divElem!=""){
		$(divElem).hide();
		return
	}
	var desc=false
	var val=false
	columns = [];
	for ( i = 0 ; i < convertedData.columns.length ; i++ ) {
		thetitle=capitalizeFirstLetter(convertedData.columns[i]).replace(/_/g, "&nbsp;")
		if(thetitle=="Description"){
			desc=true
		}
		if(thetitle.replace("&nbsp;","")=="Value"){
			val=true
		}
		//console.log("THETITLE: "+thetitle)
		var column = {
		data: convertedData.columns[i],
		title: thetitle,
		defaultContent: "",
		}
		columns.push(column)
	}
	if(false && desc && val){
		lastlabel=""
		accvalue=""
		accsource=""
		convertedDataReduced=[]
		for(i=0;i<convertedData.data.length;i++){
			//console.log(convertedData.data[i])
			if("description" in convertedData.data[i] && "value_" in convertedData.data[i]){
				if(lastlabel==""){
					lastlabel=convertedData.data[i]["description"]
					accvalue=convertedData.data[i]["value_"]+(lastlabel in sepcharmap)?sepcharmap[lastlabel]:"<br/>"
					accsource=""
					if("source" in convertedData.data[i]){
						accsource=convertedData.data[i]["source"]+(lastlabel in sepcharmap)?sepcharmap[lastlabel]:"<br/>"
					}
				}else if(convertedData.data[i]["description"]!=lastlabel){
					if("value_" in convertedData.data[i-1]){
						moddata=$.extend( true, {}, convertedData.data[i-1] );
						moddata["value_"]=accvalue
						if(accsource!=""){
							moddata["source"]=accsource
						}
						convertedDataReduced.push(moddata)
					}
					accvalue=""
					accsource=""
					lastlabel=convertedData.data[i]["description"]
					accvalue=convertedData.data[i]["value_"]+(lastlabel in sepcharmap)?sepcharmap[lastlabel]:"<br/>"
					if("source" in convertedData.data[i]){
						accsource=convertedData.data[i]["source"]+(lastlabel in sepcharmap)?sepcharmap[lastlabel]:"<br/>"
					}
				}else{
					accvalue+=convertedData.data[i]["value_"]+(convertedData.data[i]["description"] in sepcharmap)?sepcharmap[convertedData.data[i]["description"]]:"<br/>"
					if("source" in convertedData.data[i]){
						accsource+=convertedData.data[i]["source"]+(lastlabel in sepcharmap)?sepcharmap[lastlabel]:"<br/>"
					}
				}
			}else{
				convertedDataReduced.push(convertedData.data[i])
				accvalue=""
				sourcevalue=""
			}
		}
		if(accvalue!=""){
			moddata=$.extend( true, {}, convertedData.data[convertedData.data.length-1] );
			moddata["value_"]=accvalue
			if(accsource!=""){
				moddata["source"]=accsource
			}
			convertedDataReduced.push(moddata)
		}	
		//console.log(convertedDataReduced)
		convertedData["data"]=convertedDataReduced
	}
	table = $(element).on( 'draw.dt', function () {
            //console.log( 'Loading' );
          //Here show the loader.
          $("#MessageContainer").html("Loading data table...");
        } )
        .on( 'init.dt', function () {
            //console.log( 'Loaded' );
           //Here hide the loader.
           $("#MessageContainer").html("Loding completed!");
		   	if(pBar!=""){
				$('#'+pBar).progressbar("destroy")
				$('#'+pBarLabel).html("")
			}
        } ).dataTable({ 
	    data: convertedData.data,
	    columns: columns,
		columnDefs: [{ type: 'natural', targets: '_all' }],
		dom: 'Bfrtip',
		buttons: [
            'copyHtml5',
            'excelHtml5',
            'csvHtml5',
            {
                extend: 'pdfHtml5',
                orientation: 'landscape'
            }
        ],
		bDestroy: true,
	    lengthMenu: [[10, 25, 100, -1], [10, 25, 100, "All"]],
	    ordering: true,
	    order: [], 
	    paging: paging,
		pagingType: "input",
	    sDom: sDom,
	});

	$(element).append(
	    '<caption><a href="https://query.wikidata.org/#' + 
		encodeURIComponent(sparql) +	
		'">Edit on query.Wikidata.org</a></caption>');
    }, "json");

}

function qToWembedderToDataTable(q, sparql, element, options={}) {
    var wembedderUrl = "https://wembedder.toolforge.org/api/most-similar/" + q;
    $.ajax({
	url: wembedderUrl,
	error: function(xhr, status, error) { $(element).append(error); },
	success: function (data) {
	    
	    var values = "";
	    data.most_similar.forEach(function(entry, idx, array) {
		values += "(wd:" + entry.item + " " + entry.similarity + ") ";
	    });
	    
	    var interpolated_sparql = sparql.replace(/#VALUES/g, values); 
	    
	    sparqlToDataTable(interpolated_sparql, element, options={}); 
	},
    });
}
