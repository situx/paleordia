namespaces=[
	"http://www.wikidata.org/entity/",
	"http://www.wikidata.org/prop/direct/"
]
var fuzzySearch=false;

function toggleFuzzySearch(){
	if(fuzzySearch){
		$('#fuzzyButton').text("Default Search")
	}else{
		$('#fuzzyButton').text("Fuzzy Search")
	}
	fuzzySearch=!fuzzySearch
};

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
				convertedRow[key] = '<span>' + data[i][key + 'Label'].replaceAll("<","&lt;").replaceAll(">","&gt;") +((key+'Label2' in data[i])?" "+data[i][key+'Label2']:"")+ '</span>';
			}else if(linkcount==1){
				thelink=(linkPrefixes[key] || "") + addParamsToLink(detectCorrectParameter(data[i][key].replace("http://www.wikidata.org/entity/","").replace("http://www.wikidata.org/prop/direct/","")),key,linkParams,data[i][key+'Label']+((key+'Label2' in data[i])?" "+data[i][key+'Label2']:""))
				temp = '<a href="'
				if(thelink.includes("<a ")){
					temp+=thelink.substring(0,thelink.indexOf("<a "))
				}else{
					temp+=thelink
				}
				temp+='" '
				if(typeof(h)!=="undefined" && data[i][key].includes(h)){
					temp+=' style="color:red"'
				}
				temp+='>'
				if(typeof(data[i][key + 'Label'])!=='undefined'){
					if(data[i][key + 'Label'].includes("<a ") && data[i][key + 'Label'].includes("</a>")){
						temp+=data[i][key + 'Label'].substring(0,data[i][key + 'Label'].indexOf("<a ")).replaceAll("<","&lt;").replaceAll(">","&gt;")
						temp+=data[i][key + 'Label'].substring(data[i][key + 'Label'].indexOf("<a "),data[i][key + 'Label'].indexOf("</a>"))+"</a>"
						if(data[i][key + 'Label'].substring(data[i][key + 'Label'].indexOf("</a>")+4).includes("<a ") && data[i][key + 'Label'].substring(data[i][key + 'Label'].indexOf("</a>")+4).includes("</a>")){
							temp+=data[i][key + 'Label'].substring(data[i][key + 'Label'].indexOf("</a>")+4)
						}else{
							temp+=data[i][key + 'Label'].substring(data[i][key + 'Label'].indexOf("</a>")+4).replaceAll("<","&lt;").replaceAll(">","&gt;")
						}						
					}else{
						temp+=data[i][key + 'Label'].replaceAll("<","&lt;").replaceAll(">","&gt;")
					}			
				}
				temp+=((key+'Label2' in data[i])?" "+data[i][key+'Label2']:"")+ '</a>';
				convertedRow[key]=temp
			}else if(linkcount>1){
				//console.log(data[i][key])
				//console.log(linkcount)
				sepchar=determineSepchar(data[i][key])
				urls=data[i][key].split(sepchar)
				labs=data[i][key+'Label'].split(sepchar)	
				res=""
				for(let i = 0; i < urls.length; i++){
					res+='<a target="_blank"'
					if(typeof(h)!=="undefined" && urls[i].includes(h)){
						res+=' style="color:red"'
					}
					res+=" href=\""
					if(urls[i].includes("<a ")){
						res+=urls[i].substring(0,urls[i].indexOf("<a "))
					}else{
						res+=urls[i]
					}
					res+="\">"
					if(typeof(labs[i])!=='undefined'){
						if(labs[i].includes("<a ") && labs[i].includes("</a>")){
							res+=labs[i].substring(0,labs[i].indexOf("<a ")).replaceAll("<","&lt;").replaceAll(">","&gt;")
							res+=labs[i].substring(labs[i].indexOf("<a "),labs[i].indexOf("</a>"))+"</a>"
							res+=labs[i].substring(labs[i].indexOf("</a>")+4).replaceAll("<","&lt;").replaceAll(">","&gt;")
						}else{
							res+=labs[i].replaceAll("<","&lt;").replaceAll(">","&gt;")
						}			
					}
					res+="</a> "+sepchar+" "
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
				//console.log("Linkcount: "+linkcount)
				if(linkcount==1){
					if(key.toLowerCase().includes("source") && "description" in data[i] && data[i]["description"].includes("Described")){
						temp= " <button class=\"btn btn-outline-dark btn-sm\" onclick=\"document.getElementById('theiframe').src='"+((linkPrefixes[key] || "")+ data[i][key + 'Url'])+"';document.getElementById('iframenewtab').href='"+((linkPrefixes[key] || "")+ data[i][key + 'Url'])+"';"
						if("value_" in data[i]){
							temp+="document.getElementById('iframeheader').innerHTML='"+data[i]["value_"]+"';"
						}
						temp+="document.getElementById('iframedialog').showModal()\">&#8599;</button>" 	
					}else if(key.toLowerCase().includes("source") && "description" in data[i] && !(data[i]["description"].includes("Described"))){
						temp = '<a target="_blank\"'
						if(typeof(h)!=="undefined" && data[i][key + 'Url'].includes(h)){
							temp+=' style="color:red"'
						}
						temp+=' href="' +(linkPrefixes[key] || "")+ data[i][key + 'Url'] +'">' + data[i][key] + '</a>';
						if("sourceLink" in data[i] && data[i]["sourceLink"].startsWith("http")){
							temp+="<button onclick=\"document.getElementById('theiframe').src='"+urls[i]+"';document.getElementById('iframenewtab').href='"+data[i]["sourceLink"]+"';"
							if("sourceLink" in data[i]){
								temp+="document.getElementById('iframeheader').innerHTML='"+data[i]["sourceLink"]+"';"
							}
							temp+="document.getElementById('iframedialog').showModal()\">&#8599;</button>" 
						}
					}else{
						temp = '<a target="_blank\"'
						if(typeof(h)!=="undefined" && data[i][key + 'Url'].includes(h)){
							temp+=' style="color:red"'
						}
						temp+=' href="' +(linkPrefixes[key] || "")+ data[i][key + 'Url'] +'">' + data[i][key] + '</a>';
					}									
					convertedRow[key]=temp
				}else if(linkcount>1){
					//console.log(data[i][key + 'Url'])
					//console.log(linkcount)
					//console.log("SEPCHAR: "+sepchar)
					sepchar=determineSepchar(data[i][key + 'Url'])
					urls=data[i][key + 'Url'].split(sepchar)
					labs=data[i][key].split(sepchar)
					//console.log(urls)
					//console.log(labs)
					res=""
					for(let i = 0; i < urls.length; i++){
						if(key.toLowerCase().includes("source") && "description" in data[i] && data[i]["description"].includes("Described")){
							res+="<button onclick=\"document.getElementById('theiframe').src='"+urls[i]+"';document.getElementById('iframenewtab').href='"+urls[i]+"';"
							if("value_" in data[i]){
								res+="document.getElementById('iframeheader').innerHTML='"+data[i]["value_"]+"';"
							}
							res+="document.getElementById('iframedialog').showModal()\">&#8599;</button>" 
						}else if(key.toLowerCase().includes("source") && "description" in data[i] && !(data[i]["description"].includes("Described"))){
							res+='<a target="_blank"'
							if(typeof(h)!=="undefined" && urls[i].includes(h)){
								res+=' style="color:red"'
							}
							res+=" href=\""+urls[i]+"\">"+labs[i]+"</a> "
							if("sourceLink" in data[i] && data[i]["sourceLink"].startsWith("http")){
								res+="<button onclick=\"document.getElementById('theiframe').src='"+urls[i]+"';document.getElementById('iframenewtab').href='"+data[i]["sourceLink"]+"';"
								if("sourceLink" in data[i]){
									res+="document.getElementById('iframeheader').innerHTML='"+data[i]["sourceLink"]+"';"
								}
								res+="document.getElementById('iframedialog').showModal()\">&#8599;</button>" 
							}
						}else{
							res+='<a target="_blank"'
							if(typeof(h)!=="undefined" && urls[i].includes(h)){
								res+=' style="color:red"'
							}
							res+=" href=\""+urls[i]+"\">"+labs[i]+"</a> "
						}
						res+=sepchar+" "
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

function determineSepchar(thekey){
	sepchar=" // "
	try{
		if(thekey.includes("http")){
			secondocc=thekey.indexOf("http",7)
			if(thekey.includes(" # ")){
				secondocccomp=thekey.indexOf(" # ")+1
				if(secondocccomp<secondocc){
					secondocc=secondocccomp
				}
			}
		}else if(thekey.includes("../")){
			secondocc=thekey.indexOf("../",3)
		}else{
			secondocc=thekey.indexOf(" ")
		}
		firsturl=thekey.substring(0,secondocc)
		var onlyNumbers = firsturl.replace(/\D/g,'');
		var lastNumber = onlyNumbers.substring(onlyNumbers.length - 1);
		var lastNumberIndex=firsturl.lastIndexOf(lastNumber)
		/*if(thekey.indexOf(" ",lastNumberIndex)>lastNumberIndex){
			lastNumberIndex=thekey.indexOf(" ",lastNumberIndex)
		}*/
		sepchar=thekey.substring(lastNumberIndex+1,secondocc)
		//console.log("found new sepchar: |"+sepchar+"| ("+sepchar.length+") | "+onlyNumbers+" ["+lastNumberIndex+" "+secondocc+"] "+firsturl+" | "+onlyNumbers+"\n"+thekey)
	}catch(err){
		console.log("ERROR: "+err)
	}
	return sepchar
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
	var desc = (typeof options.desc === 'undefined') ? "" : options.desc;
	var iframedialog = (typeof options.iframedialog === 'undefined') ? "" : options.iframedialog;
    var linkPrefixes = (typeof options.linkPrefixes === 'undefined') ? {} : options.linkPrefixes;
	var linkParams = (typeof options.linkParams === 'undefined') ? {} : options.linkParams;
    var paging = (typeof options.paging === 'undefined') ? true : options.paging;
    var sDom = (typeof options.sDom === 'undefined') ? 'lfrtip' : options.sDom;
	var pBar = (typeof options.pBar === 'undefined') ? '' : options.pBar;
	var highlight = (typeof options.highlight === 'undefined') ? '' : options.highlight;
	var highlightcol = (typeof options.highlightcol === 'undefined') ? 0 : options.highlightcol;
	var pBarLabel = (typeof options.pBarLabel === 'undefined') ? '' : options.pBarLabel;
	var sepcharmap=(typeof options.sepcharmap === 'undefined') ? {} : options.sepcharmap;
	if(pBar!="" && pBarLabel!=""){
	 $("#"+pBarLabel).html("Loading... (Execute Query)")
	}
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
    if(desc!=""){
	$(element).append(
	    '<caption><a href="https://query.wikidata.org/#' + 
		encodeURIComponent(sparql) +'" target="_blank">Edit on query.Wikidata.org</a><span style="float:right"><button disabled class="btn btn-outline-dark btn-sm" id="infoButton" title="'+desc+'">&#9432;</button></span></caption>');
	}else{
	$(element).append(
	    '<caption><a href="https://query.wikidata.org/#' + 
		encodeURIComponent(sparql) +'" target="_blank">Edit on query.Wikidata.org</a></caption>');
	}
       $.post(post_url, post_data).done(function(response) {
	if(pBar!="" && pBarLabel!=""){
	    $("#"+pBarLabel).html("Loading... (Processing response)")
	}

	var simpleData = sparqlDataToSimpleData(response);

	convertedData = convertDataTableData(simpleData.data, simpleData.columns, linkPrefixes=linkPrefixes,linkParams=linkParams);
	//console.log(convertedData)
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
	var table = $(element).on( 'draw.dt', function () {
            //console.log( 'Loading' );
          //Here show the loader.
          $("#MessageContainer").html("Loading data table...");
        } )
        .on( 'init.dt', function () {
            //console.log( 'Loaded' );
           //Here hide the loader.
           $("#MessageContainer").html("Loading completed!");
		   	if(pBar!=""){
				$('#'+pBar).progressbar("destroy")
				$('#'+pBarLabel).html("")
			}
			$(".dataTables_filter input")
			.off('.DT')
			.on('keyup.DT cut.DT paste.DT input.DT search.DT', function (e) {
				  // console.log("Searching dt with neutralize accent")
				  $(element).DataTable().search(neutralizeAccent(this.value)).draw();
			   }
			);
        } ).DataTable({ 
	    data: convertedData.data,
	    columns: columns,
		columnDefs: [{ type: 'natural-nohtml', targets: '_all' }],
		dom: 'lBfrtip',
		hideEmptyCols: true,
		layout:{
			top1Start:'pageLength',
			top1: {
			   buttons: [
				{
                    extend: 'spacer',
                    style: 'bar',
                    text: ''
                },
				'copyHtml5',
				'excelHtml5',
				'csvHtml5',
				{
					extend: 'pdfHtml5',
					orientation: 'landscape',
					download: 'open'
				}
				]
			}
		},
		bDestroy: true,
	    lengthMenu: [[10, 25, 100,250,500,1000, -1], [10, 25, 100,250,500,1000, "All"]],
	    ordering: true,
	    order: [], 
	    paging: paging,
		pagingType: "input",
	    sDom: sDom,
	});
	if(highlight!=""){
		res=table.page.jumpToData(highlight,highlightcol)
		console.log(res)
		//table.fnPageChange(pageNo-1)//.draw('page');
	}
	/*table.columns().every(function() {
		var that = this;

		$('input', this.footer()).on('keyup change', function() {
		  if (that.search() !== this.value) {
			that
			  .search(this.value)
			  .draw();
		  }
		});
	});*/

    }).fail(function(xhr,textStatus,errorThrown){
		console.log(errorThrown)
		if(pBar!="" && pBarLabel!=""){
			$('#'+pBar).progressbar("destroy")
			$("#"+pBarLabel).html("<span style=\"color:red\">An error occurred while querying<br/>If this error is temporary you may try to reload the page!<br/>Error message:<br/><pre>"+xhr.responseText+"</pre>")
		}
	});

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
