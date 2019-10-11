var margin = {top: 10, right: 50, bottom: 10, left: 50},
    svgwidth = window.screen.availWidth - margin.left - margin.right,
    svgheight = window.screen.availHeight - margin.top - margin.bottom - 120,
    scalemargin = {top: 40, right: 100, bottom: 200, left: 50};

d3.dsv(",","earthquakes.csv", function(d){
    for (var key in d) {
        if (key == "States" || key == "Category") continue;
        else d[key] = parseInt(d[key]);
    }
    return d;
}).then(function(datum){
	/* {Category: [{States, year, number}, ...], } */
	var categoryGroup = (function(data){
		let interGroup = d3.nest()
			.key(function(d) { return d.Category; })
			.entries(data)
		var returnGroup = {};
		interGroup.forEach(function(group) {
			returnGroup[group.key] = [];
			group.values.forEach(function(detail) {
				for (var key in detail) {
					if (key != "Category" && key != "States")
						returnGroup[group.key].push({States: detail["States"], year: key, number: detail[key]});
				}
			})
		});
		return returnGroup;
		})(datum);

	var yearGroup = d3.keys(datum[0]).filter(function(d) { if (d == "States" || d == "Category") return false; else return true; }).sort(d3.ascending);

	d3.select("#main").select("h1")
		.attr("id", "title")
		.style("margin", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px");

	var colorRange = ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"]

	var marginDesSelector = {top: "10px", bottom: "10px"};
	d3.select("#main").select("span")
		.attr("id", "description")
		.style("margin-left", (margin.left + 100) + "px")
		.style("margin-top", marginDesSelector.top)
		.style("margin-bottom", marginDesSelector.bottom);

	var selector = d3.select("#main").append("select")
		.on("change", updateHeatmap)
		.attr("id", "stateSelect")
		.style("margin-top", marginDesSelector.top)
		.style("margin-bottom", marginDesSelector.bottom)

	selector.selectAll("option")
		.data(d3.keys(categoryGroup))
		.enter()
		.append("option")
		.attr("value", function(d) { return d; })
		.text(function(d) { return d; });

	selector.property("value", "0 to 9");

	d3.select("#main").append("br");
	
	var svg = d3.select("#main").append("svg")
		.attr("id", "visualization")
		.attr("width", svgwidth)
		.attr("height", svgheight)
		.style("margin", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px");
	svg.append("g").attr("class", "x-axis").attr("transform", "translate(0," + (svgheight - scalemargin.bottom) + ")");
	svg.append("g").attr("class", "y-axis").attr("transform", "translate(" + scalemargin.left + ",0)");
	svg.append("text").attr("id", "color-des").attr("transform", "translate(100," + (svgheight - scalemargin.bottom + 100) + ")")
	.text("Count");

	var blockLegend = svg.selectAll(".blockLegend").data(colorRange)
		.enter().append("rect").attr("class", "blockLegend")
		.attr("x", function(d, i) { return scalemargin.left + 20 + 50 * i; })
		.attr("y", svgheight - scalemargin.bottom + 120)
		.attr("width", 50)
		.attr("height", 30)
		.style("fill", function(d) { return d; });
	
	updateVisualization(d3.select("#stateSelect").property("value"));

	function updateMouseover(){
		let descriptionData = d3.select(this).data()[0];
		var descriptionShow = svg.selectAll(".mouseoverDescrip").data([descriptionData["States"] + " " + descriptionData["year"] + ": " + descriptionData["number"]]);
		descriptionShow.exit().remove();
		descriptionShow.enter().append("text").attr("class", "mouseoverDescrip").merge(descriptionShow)
		.attr("x", svgwidth/2 - 50)
		.attr("y", 20)
		.text(function(d) { return d; });
	}

	function updateMouseout(){
		var descriptionShow = svg.selectAll(".mouseoverDescrip")
			.text("");
	}

	function updateVisualization(selectedCategory){
		var xdomain = categoryGroup[selectedCategory].map(function(d){ return d.States; });
		var xScale = d3.scaleBand()
			.domain(xdomain)
			.range([scalemargin.left, svgwidth - scalemargin.right])
			.padding(0.02);
		var yScale = d3.scaleBand()
			.domain(yearGroup)
			.range([scalemargin.top, svgheight - scalemargin.bottom])
			.padding(0.02);
		svg.select(".x-axis").call(d3.axisBottom(xScale).tickSize(0))
			.selectAll("text")
			.attr("y", 5)
			.style("text-anchor", "middle")
        	.attr("transform", function(d){ return "rotate(-35, " + (d3.select(this).attr("x") + d3.select(this).node().getComputedTextLength() / 2) + "," + d3.select(this).attr("y") + ")"; });
		svg.select(".y-axis").call(d3.axisLeft(yScale).tickSize(0));

		var numberRange = d3.extent(categoryGroup[selectedCategory], function(d) { return d.number; });

		var colorScale = d3.scaleQuantize()
			.domain(numberRange)
			.range(colorRange);

		var textLegend = svg.selectAll(".textLegend").data(colorRange);
		textLegend.exit().remove();
		textLegend.enter().append("text").attr("class", "textLegend").merge(textLegend)
		.attr("x", function(d, i) { return scalemargin.left + 20 + 50 * i; })
		.attr("y", svgheight - scalemargin.bottom + 170)
		.text(function(d) { return Math.round(colorScale.invertExtent(d)[0]) + ""; });

		var blockSelect = svg.selectAll(".block").data(categoryGroup[selectedCategory]);
		blockSelect.exit().remove();
		blockSelect.enter().append("rect").attr("class", "block").merge(blockSelect)
		.attr("x", function(d) { return xScale(d.States); })
		.attr("y", function(d) { return yScale(d.year); })
		.attr("width", xScale.bandwidth())
		.attr("height", yScale.bandwidth())
		.attr("rx", 6)
    	.attr("ry", 6)
		.style("fill", function(d) { return colorScale(d.number); })
		.on("mouseover", updateMouseover)
		.on("mouseout", updateMouseout);
	}
	
	function updateHeatmap(){
		var selectedCategory = d3.select(this).property("value");
		updateVisualization(selectedCategory);
	}
});