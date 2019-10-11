var parseTime = d3.timeParse("%Y");
d3.dsv(",","sample.csv", function(d){
	return {
		year : parseTime(d.year),
		running_total : parseInt(d.running_total)
	};
}).then(function(datum){
	/* display bar chart */
	datum.sort(d3.ascending);
	var dataRange = {
		MinYear : d3.min(datum, function(d){ return d.year; }),
		MaxYear : d3.max(datum, function(d){ return d.year; }),
		MinRunning : d3.min(datum, function(d){ return d.running_total; }),
		MaxRunning : d3.max(datum, function(d){ return d.running_total; }),
		displayOffset : 5
	}

	var barChartDefine = {xSetting : {xStart: 60, xEnd: 60 + 20 * datum.length}, ySetting : {yStart: 640, yEnd: 40}, barWidth: 15};

    var xScale = d3.scaleTime()
                    .domain([dataRange.MinYear, dataRange.MaxYear])
                    .range([barChartDefine.xSetting.xStart, barChartDefine.xSetting.xEnd]);

    var yScale = d3.scaleLinear()
                    .domain([dataRange.MinRunning - dataRange.displayOffset, dataRange.MaxRunning + dataRange.displayOffset])
                    .range([barChartDefine.ySetting.yStart, barChartDefine.ySetting.yEnd]);

    var xAxis = d3.axisBottom(xScale)
                   .ticks(d3.timeYear.every(3));
    var yAxis = d3.axisLeft(yScale);
    
    var svg = d3.select("#display-bar")
    			.append('svg')
    			.attr('id', 'bar-chart')
    			.attr('width', barChartDefine.xSetting.xEnd + 2 * barChartDefine.xSetting.xStart + "")
    			.attr('height', barChartDefine.ySetting.yStart + 4 * barChartDefine.ySetting.yEnd + "");

    svg.append('g')
    	.attr('class', 'x-axis')
    	.attr('transform', function(d){ return 'translate(0,' + (barChartDefine.ySetting.yStart) + ')'; })
    	.call(xAxis);

    svg.append('g')
    	.attr('class', 'y-axis')
    	.attr('transform', function(d){ return 'translate('+ barChartDefine.xSetting.xStart + ', 0)'; })
    	.call(yAxis);

    svg.append('text')
    	.text('Barchart Running Total - Year')
        .attr('class', 'title')
        .attr('transform','translate(' + ((barChartDefine.xSetting.xStart + barChartDefine.xSetting.xEnd) / 2 - 150) + ',' + (barChartDefine.ySetting.yEnd - 20) + ')');
    
    svg.selectAll('rect')
    	.data(datum)
    	.enter()
    	.append('rect')
    	.attr('x', function(d) { return xScale(d.year) - barChartDefine.barWidth / 2; })
    	.attr('y', function(d) { return yScale(d.running_total); })
    	.attr('height', function(d) { return barChartDefine.ySetting.yStart - yScale(d.running_total); })
    	.attr('width', barChartDefine.barWidth + "");
});