var margin = {top: 40, right: 50, bottom: 40, left: 50},
    svgwidth = window.innerWidth - margin.left - margin.right,
    svgheight = window.innerHeight - margin.top - margin.bottom;


var svg = d3.select("#main").append("svg")
		.attr("width", svgwidth)
		.attr("height", svgheight)
		.attr("margin", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px");

var unemployment = d3.map();

var path = d3.geoPath().projection(d3.geoAlbersUsa().translate([0.95*svgwidth/2, 1.05*svgheight/2, 0]).scale(3000));

var Maplegend = svg.append("g").attr("id", "Maplegend").attr("transform", "translate(" + svgwidth * 0.86 + "," + svgheight * 0.2 + ")");
Maplegend.append("text").attr("id", "legendTitle").attr("x", 5).attr("y", 5).text("Earthquake Frequency");

async function fetchDataContent(){
	let stateGeometry = await d3.json("./states-10m.json");
	let stateEearthquake = await d3.dsv(",","./state-earthquakes.csv", d => ( {States: d["States"], Region: d["Region"], TotalEq: parseInt(d["Total Earthquakes"])} ) );

	let earthquakeMap = d3.map();
	stateEearthquake.forEach(function(d){ earthquakeMap.set(d["States"], d)});

	/* display data */
	var miniResolution = 1;
	var earthquakeRange = d3.extent(stateEearthquake, d => d.TotalEq)
		.map(d => { return (d < miniResolution)? Math.log(miniResolution) : Math.log(d);})

	var colorMap = d3.schemeReds[9];

	var colorScale = d3.scaleQuantize()
		.domain(earthquakeRange)
		.range(colorMap);

	var legendGroup = Maplegend.append("g")
		.attr("class", "legendDetailGroup")
	
	legendGroup.selectAll(".legendRect").data(colorMap)
		.enter().append("rect")
		.attr("class", "legendRect")
		.attr("x", 55)
		.attr("y", (d,i) => 35 + i * 70)
		.attr("width", 60)
		.attr("height", 60)
		.style("fill", d => d);

	legendGroup.selectAll(".legendText").data(colorMap)
		.enter().append("text")
		.attr("class", "legendText")
		.attr("x", 135)
		.attr("y", (d,i) => 75 + i * 70)
		.text(d => Math.round(Math.exp(colorScale.invertExtent(d)[0])))
		.style("text-anchor", "start");
	
	tip = d3.tip().attr('class', 'd3-tip').html(function(d) { 
		let eqState = earthquakeMap.get(d.properties.name);
			return (eqState != undefined)?
				"<p>State: " + eqState["States"] + "<br>Region: " + eqState["Region"] + "<br>Earthquakes: " + eqState["TotalEq"] + "</p>" : "<p></p>";
		}).offset([20, 40])

	svg.append("g")
	    .attr("class", "state")
	    .call(tip)
	    .selectAll("path")
	    .data(topojson.feature(stateGeometry, stateGeometry.objects.states).features)
	    .enter().append("path")
	    .attr("id", function(d, i){ return "path-" + i; })
	    .attr("d", path)
	    .attr("fill", function(d) {
	    		let eqState = earthquakeMap.get(d.properties.name);
	    		if (eqState == undefined)
	    			return colorScale(Math.log(miniResolution));
	    		return (eqState["TotalEq"] < miniResolution)? colorScale(Math.log(miniResolution)) : colorScale(Math.log(eqState["TotalEq"]));
	    })
	   	.on('mouseover', function(d, i){
	   		d3.select("#path-fake-" + i).attr("stroke-opacity", "0.5");
	    	tip.show(d);
	    })
	    .on('mouseout', function(d, i){
	   		d3.select("#path-fake-" + i).attr("stroke-opacity", "0");
	    	tip.hide();
	    });

	svg.append("g")
	    .attr("class", "fake-state")
	    .selectAll("path")
	    .data(topojson.feature(stateGeometry, stateGeometry.objects.states).features)
	    .enter().append("path")
	    .attr("id", function(d, i){ return "path-fake-" + i; })
	    .attr("d", path)
	    .attr("fill", "none")
	    .attr("stroke-opacity", "0");
}

fetchDataContent();