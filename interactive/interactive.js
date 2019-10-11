var margin = {top: 40, right: 80, bottom: 40, left: 50},
    svgwidth = window.screen.availWidth - margin.left - margin.right,
    svgheight = window.screen.availHeight - margin.top - margin.bottom,
    scalemargin = {top: 50, right: 50, bottom: 40, left: 150};

var parseTime = d3.timeParse("%Y");
d3.dsv(",","state-year-earthquakes.csv", function(d){
    d.year = parseTime(d.year);
    d.count = parseInt(d.count);
    return d;
}).then(function(datum){
    let regionYearDataSumGroup = d3.nest().key(function(d){ return d.region; }).key(function(d) { return d.year; }).rollup(function(data){ return d3.sum(data, function(d){ return d.count; }); }).entries(datum);
    
    var lineChartData = [];
    regionYearDataSumGroup.forEach(function(data){ data.values.forEach(function(d){ lineChartData.push({region: data.key, year: new Date(d.key), sumCount: d.value}); })});

    var xScaleLine = d3.scaleTime()
        .domain(d3.extent(datum, function(d){ return d.year; }))
        .range([scalemargin.left, svgwidth - scalemargin.right]);

    var yScaleLine = d3.scaleLinear()
        .domain(d3.extent(lineChartData, function(d){ return d.sumCount; }))
        .range([svgheight - scalemargin.bottom, scalemargin.top]);
    
    var colorMap = {'Midwest': '#fb8072', 'Northeast': '#80b1d3', 'South': '#8dd3c7', 'West': '#fdb462'}

    var line = d3.line().x(function(d) { return xScaleLine(d.year); })
        .y(function(d) { return yScaleLine(d.sumCount); })
        .curve(d3.curveMonotoneX);

    var lineChartSymbol = d3.select("#main")
        .append("svg")
        .attr("id", "symbolLine")      
        .attr("width", svgwidth)
        .attr("height", svgheight)
        .style("margin", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px");
    
    lineChartSymbol.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (svgheight - scalemargin.bottom) + ")")
        .call(d3.axisBottom(xScaleLine));
    lineChartSymbol.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(" + scalemargin.left + ",0)")
        .call(d3.axisLeft(yScaleLine));
    
    lineChartSymbol.selectAll(".linePlot")
        .data(regionYearDataSumGroup)
        .enter()
        .append("path")
        .attr("class", "linePlot")
        .attr('d', function(data){ 
            return line(data.values.map(function(d){ return {year: Date.parse(d.key), sumCount: d.value};}));
        })
        .style('stroke', function(data){ return colorMap[data.key]; });

    lineChartSymbol.selectAll("dataPoint")
        .data(lineChartData)
        .enter()
        .append("circle")
        .attr("class", "dataPoint")
        .attr("cx", function(data){ return xScaleLine(data.year); })
        .attr("cy", function(data){ return yScaleLine(data.sumCount); })
        .attr("r", 6)
        .style("fill", function(data){ return colorMap[data.region]; })
        .on("mouseover", mouseoverCircle)
        .on("mouseout", mouseoutCircle);
    
    lineChartSymbol.append('text').attr('class', 'title')
        .attr('transform', 'translate('+[svgwidth/2 - 200, 20]+')')
        .text('US Earthquakes by Region 2010-2015');

    var legendHolder = regionYearDataSumGroup.map(function(d, i){ return d.key; }).sort(d3.ascending).map(function(d, i){ return {id: i, region: d}; });

    var legendGroup = lineChartSymbol.append("g")
        .attr("class","legend")
        .attr("transform","translate(" + (svgwidth - scalemargin.right - 300) + "," + (scalemargin.top + 20) + ")")
        
    legendGroup.selectAll("circle")
        .data(legendHolder)
        .enter()
        .append("circle")
        .attr("cx", 10)
        .attr("cy", function(d){ return (d.id - 1) * 25; })
        .attr("r", 8)
        .style("fill", function (d) { return colorMap[d.region]; });

    legendGroup.selectAll("text")
        .data(legendHolder)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", function(d){ return (d.id - 1) * 25 + 5; })
        .text(function(d){ return d.region; })

    // region year data
    var regionYearData = {};
    d3.nest().key(function(d){ return d.region; })
        .key(function(d) { return d.year; }).entries(datum)
        .forEach(function(data){
            regionYearData[data.key] = {}; 
            data.values.forEach(function(da){ 
                regionYearData[data.key][da.key] = da.values; 
            });
        });

    for (var key1 in regionYearData){
        for (var key2 in regionYearData[key1]){
            regionYearData[key1][key2].sort(function(a,b){
                if (a.count < b.count) return -1;
                else if (a.count > b.count) return 1;
                else {
                    if (a.state < b.state) return -1;
                    else return 1;
            }
        })
        }
    }

    d3.select("#main").append("br");

    var barChart = d3.select("#main")
            .append("svg")
            .attr("id", "barChart")
            .attr("width", svgwidth)
            .attr("height", svgheight)
            .style("margin", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px");
    
    barChart.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (svgheight - scalemargin.bottom) + ")");

    barChart.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(" + scalemargin.left + ",0)");

    barChart.append('text').attr('class', 'title')
        .attr('transform', 'translate('+[svgwidth/2 - 150, 20]+')')
        .text('');

    function mouseoverCircle(){
        let originalR = d3.select(this).attr("r");
        d3.select(this).attr("r", 2*originalR);
        let selectedData = d3.select(this).data()[0];
        console.log(selectedData);
        updateBarchart([selectedData.region, selectedData.year]);
    }

    function mouseoutCircle(){
        let largeR = d3.select(this).attr("r");
        d3.select(this).attr("r", largeR/2);
        barChart.select(".x-axis").style("opacity", 0);
        barChart.select(".y-axis").style("opacity", 0);
        barChart.select(".title").style("opacity", 0);
        barChart.selectAll(".barState").style("opacity", 0);
    }

    function updateBarchart(selectedInformartion){
        let selectedData = regionYearData[selectedInformartion[0]][selectedInformartion[1]+""];

        var yScaleBar = d3.scaleBand()
            .domain(selectedData.map(function(d){ return d.state; }))
            .range([svgheight - scalemargin.bottom, scalemargin.top])
            .padding(0.1);

        var xScaleBar = d3.scaleLinear()
            .domain(d3.extent(selectedData, function(d){ return d.count; }))
            .range([scalemargin.left, svgwidth - scalemargin.right]);

        barChart.select(".x-axis").call(d3.axisBottom(xScaleBar))
            .style("opacity", 1)
            .selectAll(".tick").select("line").attr("y2", -(svgheight - scalemargin.bottom - scalemargin.top));
        barChart.select(".y-axis").call(d3.axisLeft(yScaleBar))
            .style("opacity", 1);
        barChart.select(".title")
            .text(selectedInformartion[0] + " Region Earthquakes " + (selectedInformartion[1].getFullYear()))
            .style("opacity", 1);

        var barState = barChart.selectAll(".barState").data(selectedData);
        barState.exit().remove();
        barState.enter().append("rect")
            .attr("class","barState").merge(barState)
            .attr("x", scalemargin.left)
            .attr("y", function(d){ return yScaleBar(d.state); })
            .attr("height", yScaleBar.bandwidth())
            .attr("width", function(d){ return xScaleBar(d.count) - scalemargin.left; })
            .attr("rx", 10)
            .attr("ry", 10)
            .style("opacity", 1)
            .style("fill", colorMap[selectedInformartion[0]]);
    }

});