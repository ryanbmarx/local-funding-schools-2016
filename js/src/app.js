import * as d3 from "d3";
import {filter} from 'underscore';
import {debounce} from 'underscore';
var d3tip = require('d3-tip');
var initTable = require('./school-funding-table');

// This array houses data used to place county labels on the chicago area chart. 
// It's a bit of a hack since the same data points are used for several counties, 
// but I just want them stacked.
const chicagoarea_median_household_incomes = [
	{county:"Cook", income:54828},
	{county:"Dupage", income:77873},
	{county:"Lake", income:77873},
	{county:"McHenry", income:77873},
	{county:"Will", income:77873},
	{county:"Kane", income:70514}
]

// function tooltip(hide, d){
// 	if (hide == 'hide') {
// 		d3.select('.tooltip').remove()
// 	} else {
// 		console.log(d);
// 	}
// }

function checkCountyGroup(county, groupToHighlight) {
	if (window.countyGroups[groupToHighlight].indexOf(county.toLowerCase()) > -1){
		return true
	}
	return false
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

	// Initialize the tooltip using d3-tip
	const tip = d3tip()
		.attr('class', 'tooltip')
		.html(function(d) { 
			return `
			<strong>${d.SCHOOL_NAME}</strong><br />
			${d.county} County<br />
			<strong>${window.y_label}:</strong> ${d3.format(".1%")(d[window.y_series])}<br />
			<strong>${window.x_label}:</strong> ${d3.format("($,")(d[window.x_series])}
			`; 
		});


	d3.select(container).selectAll('*').remove();

	// Get our dimensions squared away. Ultimately the size of the chart is 
	// governed by the size of the container, which is set with CSS. 
	const 	bbox = d3.select(container).node().getBoundingClientRect();
	const 	height = bbox.height,
			width = bbox.width,
			margin = {top:45, right:15, bottom:45, left:60},
			innerHeight = height - margin.top - margin.bottom,
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
	const xMin = d3.min(data, d => parseFloat(d[window.x_series]));

	const x = d3.scaleLinear()
		.domain([xMin, xMax])
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


	// Now with the X, which we want to format differently at smaller widths
		let xScale;
		if (window.innerWidth > 600){
			// Wide widths
			xScale = d3.axisBottom(x)
				.ticks(5, "($,f");
		} else {
			// Skinny widths
			xScale = d3.axisBottom(x)
				.ticks(5, "s");
		}

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
    	.attr('y', innerHeight + margin.bottom)
    	.attr('dy', '-.5em')
    	.attr("text-anchor", "middle")
    	.text(window.x_label);

    // Median illinois household income
	const median_x = 59588;

	scatterPlot.append('line')
		.attr('y1',0)
		.attr('x1', x(median_x))
		.attr('y2', innerHeight)
		.attr('x2', x(median_x))
		.style('stroke', '#e0e0e0')
		.style('stroke-width', 3)
	
	scatterPlot.append('text')
		.classed('scatter__median-label', true)
		.text(`Illinois median`)
		.attr('y',0)
		.attr('x', x(median_x))
		.attr('dy', '-1.6em')
		.attr('text-anchor', 'middle')

	scatterPlot.append('text')
		.classed('scatter__median-label', true)
		.text(`income: ${d3.format("($,")(median_x)}`)
		.attr('y',0)
		.attr('x', x(median_x))
		.attr('dy', '-.5em')
		.attr('text-anchor', 'middle')

	// scatterPlot.append('polygon')
	// 	.attr('points',`${x(median_x)},7 ${x(median_x) + 5},-2  ${x(median_x) - 5},-2  ${x(median_x)},7`)
	// 	.style('fill', '#888888');

	// If on desktop, enable tooltips
	if(window.innerWidth > 850){scatterPlot.call(tip);}

	scatterPlot.selectAll('circle')
		.data(filteredData)
		.enter()
		.append('circle')
			.classed('scatter__district', true)
			.attr('cx', d => x(parseFloat(d[window.x_series])))
			.attr('cy', d => d[window.y_series] != "" ? y(parseFloat(d[window.y_series])) : 0)
			.attr('r', 5)
			.attr('data-district', d => d.district_name)
			.attr('data-county', d => d.county)
			.attr('data-district-id', d => d.app_unique)
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);

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
		.text(`Median: ${d3.format('.0%')(median_y)} local funding`)
		.attr('y',y(median_y))
		.attr('x', innerWidth)
		.attr('dy', '-.3em')
		.style('text-anchor', 'end')
		.style('color', 'white')
		.style('stroke', 'white')
		.style('stroke-width', 3)
		.style('opacity', .75)
		.classed('scatter__median-label', true);

	scatterPlot.append('text')
		.text(`Median: ${d3.format('.0%')(median_y)} local funding`)
		.attr('y',y(median_y))
		.attr('x', innerWidth)
		.attr('dy', '-.3em')
		.style('text-anchor', 'end')
		.classed('scatter__median-label', true);
	
	if (highlight == "chicagoArea"){
		chicagoarea_median_household_incomes.forEach((county, index)=>{
		let dy = 0 - (18 * index) - 10,
			xPos = x(county.income),
			yPos = innerHeight;

		scatterPlot.append('text')
			.classed('scatter__county-label', true)
			.text(`${county.county}`)
			.attr('y',yPos)
			.attr('x', xPos)
			.attr('dy', `${dy}px`)
			.style('text-anchor', 'middle')
			.style('color', 'white')
			.style('stroke', 'white')
			.style('stroke-width', 3)
			.style('opacity', .75)
			.style('font-weight', "bold");

		scatterPlot.append('text')
			.classed('scatter__county-label', true)
			.text(`${county.county}`)
			.attr('y',yPos)
			.attr('x', xPos)
			.attr('dy', `${dy}px`)
			.style('text-anchor', 'middle')
			.style('font-weight', "bold");
		})
	}

}

window.onload = function(){
	initTable();
	// load the data
	d3.csv(`http://${window.ROOT_URL}/data/schools-data.csv`, (err, data) => {
		if (err) throw err;
		let containers = document.querySelectorAll('.scatter__container');
		
		// Go through each container and draw the scatter
		containers.forEach((container, idx) => {
			const highlight = d3.select(container).node().dataset.highlight; 
			drawScatter(data, container, highlight);
		})
	})
}

