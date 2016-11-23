import * as d3 from "d3";
import {filter} from 'underscore';
import {debounce} from 'underscore';


function checkCountyGroup(county, groupToHighlight) {
	if (window.countyGroups[groupToHighlight].indexOf(county.toLowerCase()) > -1){
		return true
	}
	return false
}

function getFillColor(d){
	const chicagoArea = ['Cook', 'DuPage', 'Lake', 'McHenry', 'Will', 'Kane'];

	let county = d.county;

	if (chicagoArea.indexOf(county) > -1){
		return 'blue';
	}
	return 'red';
}

function drawScatter(data, container, highlight){
	// Log what the hell is going on.
	console.log(`Putting a ${highlight} chart into ${container}`);

	let filteredData;

	// Start by filtering data to desired grouping.
	if (highlight == 'all'){
		filteredData = data;
	} else {
		filteredData = filter(data, (district) =>{
			return checkCountyGroup(district.county, highlight)
		})
	}

	d3.select(container).selectAll('*').remove();

	// Get our dimensions squared away. Ultimately the size of the chart is 
	// governed by the size of the container, which is set with CSS. 
	const 	bbox = d3.select(container).node().getBoundingClientRect();
	const 	height = bbox.height,
			width = bbox.width,
			margin = {top:15, right:15, bottom:50, left:60},
			innerHeight = height - margin.top - margin.left,
			innerWidth = width - margin.left - margin.right;
	// Get our basic chart container in order.
	const scatterPlot = d3.select(container)
		.append('svg')
			.attr('height', height)
			.attr('width', width)
		.append('g')
			.classed('chart-inner', true)
			.attr('height', innerHeight)
			.attr('width', innerWidth)
			.attr('transform', `translate(${margin.left}, ${margin.top})`)
	
	// Make our scales
	const xMax = d3.max(data, d => parseFloat(d[window.x_series]));
	const x = d3.scaleLinear()
		.domain([0, xMax])
		.range([0, innerWidth]);

	const y = d3.scaleLinear()
		.domain([0, 1])
		.range([innerHeight, 0]);

	// Apply those scales as axes

	// Start with the Y
	const yScale = d3.axisLeft(y)
		.ticks(10, "%");

	scatterPlot.append("g")
    	.classed('y', true)
    	.classed('axis', true)
    	.call(yScale);

    // Apply Y label
    scatterPlot.append('text')
    	.classed('axis-label', true)
    	.classed('axis-label--y', true)
    	.attr('y', 0-margin.left)
    	.attr('dy', '1em')
    	.attr('x', 0-innerHeight/2)
    	.attr("text-anchor", "middle")
    	.attr('transform', `rotate(-90)`)
    	// .attr('transform', `translate(${(-1 * height / 2)-15}, 200) rotate(-90)`)
    	.text(window.y_label);


	// Now with the X
	const xScale = d3.axisBottom(x)
	scatterPlot.append("g")
    	.classed('x', true)
    	.classed('axis', true)
    	.attr('transform', `translate(${0},${innerHeight})`)
    	.call(xScale);

    // Apply X label
    scatterPlot.append('text')
    	.classed('axis-label', true)
    	.classed('axis-label--x', true)
    	.attr('x', innerWidth/2)
    	.attr('y', (innerHeight + margin.top + 30))
    	.attr("text-anchor", "middle")
    	.text(window.x_label);

	scatterPlot.selectAll('circle')
		.data(filteredData)
		.enter()
		.append('circle')
			.classed('scatter__district', true)
			.attr('cx', d => x(parseFloat(d[window.x_series])))
			.attr('cy', d => {
				if(d[window.y_series] > -1){
					// Some districts don't have this data. Can't delete them until diane says so.
					return y(parseFloat(d[window.y_series]))
				}
				return 0;
			})
			.attr('r', 5)
			// .style('fill', 'blue')
			// .style('opacity', .3)
			.attr('data-district', d => d.district_name)
			.attr('data-county', d => d.county);

	// DRAW A LINE FOR THE MEDIAN
	const median_y = d3.median(filteredData, d => d[window.y_series]);

	scatterPlot.append('line')
		.attr('x1',0)
		.attr('y1', y(median_y))
		.attr('x2', innerWidth)
		.attr('y2', y(median_y))
		.style('stroke', 'black')
		.style('stroke-width', 1)
		.style('stroke-dasharray', "5, 5");

	// Label the median line

	scatterPlot.append('text')
		.text(`Median: ${d3.format('.1%')(median_y)}`)
		.attr('y',y(median_y))
		.attr('x', innerWidth)
		.attr('dy', '-.3em')
		.style('text-anchor', 'end')
		.classed('scatter__median-label', true);

}

window.onload = function(){
	// load the data
	d3.csv(`http://${window.ROOT_URL}/data.csv`, (err, data) => {
		if (err) throw err;
		let containers = document.querySelectorAll('.scatter__container');
		
		// Go through each container and draw the scatter
		containers.forEach((container, idx) => {
			const highlight = d3.select(container).node().dataset.highlight; 
			drawScatter(data, container, highlight);
		})
	})
}

