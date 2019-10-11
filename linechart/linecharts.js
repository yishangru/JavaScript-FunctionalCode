var margin = {top: 150, right: 50, bottom: 20, left: 50},
    svgwidth = window.innerWidth - margin.left - margin.right,
    svgheight = window.innerHeight - margin.top - margin.bottom,
    scalemargin = {top: 100, right: 200, bottom: 100, left: 110};

var parseTime = d3.timeParse("%Y");
d3.dsv(",","earthquakes.csv", function(d){
    for (var key in d) {
        if (key == "year") d[key] = parseTime(d[key]);
        else d[key] = parseInt(d[key]);
    }
    return d;
}).then(function(datum){
    var yearRange = d3.extent(datum, function(d) { return d.year; });
    var numberRange = d3.extent((function(data){
        var numberHolder = [];
        data.forEach(function(d){
            for (let key in d) {
                if (key != "year" && key != "Estimated Deaths")
                    numberHolder.push(d[key])
            }
        });
        return numberHolder;
    })(datum));
    var deathRange = d3.extent(datum, function(d) { return d["Estimated Deaths"]; })

    var miniSolution = 1;
    if (numberRange[0] < miniSolution) numberRange[0] = miniSolution;

    var magnitudeGroup = (function(data){
        let magnitudeHolder = [];
        data.forEach(function(d){
            for (let key in d) {
                if (key != "year" && key != "Estimated Deaths")
                    magnitudeHolder.push({"magnitude": key, "year": d.year, "number": d[key]});
            }
        })
        return d3.nest().key(function(d){ return d.magnitude + ''; }).entries(magnitudeHolder);
    })(datum);

    var yearDeathMap = {};
    datum.forEach(function(d) { yearDeathMap[d.year] = d["Estimated Deaths"]; });

    var xScale = d3.scaleTime()
        .domain(yearRange)
        .range([scalemargin.left, svgwidth - scalemargin.right]);

    var yScale;
    
    var colorMap = {'5_5.9': '#FFC300', '6_6.9': '#FF5733', '7_7.9': '#C70039', '8.0+': '#900C3F'}

    var deathScale = d3.scaleSqrt()
        .domain(deathRange)
        .range([5, 15]);

    var line = d3.line().x(function(d) { return xScale(d.year); })
        .y(function(d) { if(d.number < miniSolution) return yScale(miniSolution); else return yScale(d.number); })
        .curve(d3.curveMonotoneX);

    var lineChartSquare = d3.select("#main").append("svg").attr("id", "squareLine");
    yScale = d3.scaleSqrt().domain(numberRange).range([svgheight - scalemargin.bottom, scalemargin.top]);
    lineChartSquare.append("g").attr("class", "y axis").attr("transform", "translate(" + scalemargin.left + ",0)")
    .call(d3.axisLeft(yScale));
    lineChartSquare.selectAll(".linePlot").data(magnitudeGroup).enter().append("path").attr("class", "linePlot")
    .attr('d', function(d){ return line(d.values); })
    .style('stroke', function(d){ return colorMap[d.key]; });
    lineChartSquare.append('text').attr('class', 'title')
    .attr('transform', 'translate('+[svgwidth/2 - 350, 20]+')')
    .text('Worldwide Earthquake stats 2000-2015 square root scale');

    magnitudeGroup.forEach(function(group) {
        group.values.forEach(function(data){
            lineChartSquare.append("circle")
                .attr("cx", (function(d){ return xScale(d.year); })(data))
                .attr("cy", (function(d){ if (d.number < miniSolution) return yScale(miniSolution); else return yScale(d.number); })(data))
                .attr("r", (function(d){ return deathScale(yearDeathMap[d.year]); })(data))
                .style("fill", (function(d){ return colorMap[d.magnitude]; })(data));
        });
    });

    d3.select("#main").append("div").attr("class", "pagebreak");

    var lineChartLog = d3.select("#main").append("svg").attr("id", "logLine");
    yScale = d3.scaleLog().domain(numberRange).range([svgheight - scalemargin.bottom, scalemargin.top]);
    lineChartLog.append("g").attr("class", "y axis").attr("transform", "translate(" + scalemargin.left + ",0)")
    .call(d3.axisLeft(yScale));
    lineChartLog.selectAll(".linePlot").data(magnitudeGroup).enter().append("path").attr("class", "linePlot")
    .attr('d', function(d){ return line(d.values); })
    .style('stroke', function(d){ return colorMap[d.key]; });
    lineChartLog.append('text').attr('class', 'title')
    .attr('transform', 'translate('+[svgwidth/2 - 300, 20]+')')
    .text('Worldwide Earthquake stats 2000-2015 log scale');
    
    magnitudeGroup.forEach(function(group) {
        group.values.forEach(function(data){
            lineChartLog.append("circle")
                .attr("cx", (function(d){ return xScale(d.year); })(data))
                .attr("cy", (function(d){ if (d.number < miniSolution) return yScale(miniSolution); else return yScale(d.number); })(data))
                .attr("r", (function(d){ return deathScale(yearDeathMap[d.year]); })(data))
                .style("fill", (function(d){ return colorMap[d.magnitude]; })(data));
        });
    });

    var svg = d3.select("#main")
      .selectAll("svg")
      .attr("width", svgwidth)
      .attr("height", svgheight)
      .style("margin", margin.top + "px " + margin.right + "px " + margin.bottom + "px " + margin.left + "px")
    
    svg.append('text').attr('class', 'y axis-label')
        .attr('transform', 'translate('+[scalemargin.left - 80, svgheight / 2 + 130]+') rotate(270)')
        .text('Num of Earthquakes');

    svg.append('text').attr('class', 'x axis-label')
        .attr('transform', 'translate('+[svgwidth / 2, svgheight - scalemargin.bottom + 60]+')')
        .text('Year');

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (svgheight - scalemargin.bottom) + ")")
        .call(d3.axisBottom(xScale));

    var legendHolder = [{"id":1, "magnitude":"5_5.9"}, {"id":2, "magnitude":"6_6.9"}, {"id":3, "magnitude":"7_7.9"}, {"id":4, "magnitude":"8.0+"}];
    var legendGroup = svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(" + (svgwidth - scalemargin.right) + "," + scalemargin.top + ")")
        
    legendGroup.selectAll("rect")
        .data(legendHolder)
        .enter()
        .append("rect")
        .attr("x", 10)
        .attr("y", function(d){ return (d.id - 1) * 25; })
        .attr("height", 18)
        .attr("width", 50)
        .style("fill", function (d) { return colorMap[d.magnitude]; });

    legendGroup.selectAll("text")
        .data(legendHolder)
        .enter()
        .append("text")
        .attr("x", 65)
        .attr("y", function(d){ return (d.id - 1) * 25 + 15; })
        .text(function(d){ return d.magnitude; })
});