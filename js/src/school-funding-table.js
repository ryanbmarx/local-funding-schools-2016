var $ = require('jquery');
var dt = require( 'datatables.net' )( window, $ );
var dr = require( 'datatables.net-responsive' )( window, $ );

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return ""; // This must be blank, sted origin null, b/c we want the table to default to "all" instead of searching for "null"
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " ").replace(/"/g, ''));
}

function initTable(){
	var districtsLookup = $('#districts-lookup').DataTable({
		"paging": true,
		"lengthMenu": [[ 10, 25, 50, 75, 100, -1 ], [ 10, 25, 50, 75, 100, "All" ]],
		"searching": true,
		"ordering": true,
		"order": [[ 5, "asc" ]],
		// "bAutoWidth":false,
		"responsive": {
			details:{
				type: 'column',
				target: 'tr'
			}, 
			breakpoints: [
				{ name: 'desktop', width: Infinity },
				{ name: 'tablet',  width: 840 },
				{ name: 'phone',   width: 420 }
			],
			"columnDefs": [ 
				{ "orderable": false, "targets": 0 }
			]
		}
	});

	let searchValue = getParameterByName('search');
	if (searchValue.length > 0){
		console.log(`Searching table for ${searchValue}`);
		districtsLookup.search(searchValue).draw();
		window.scrollTo(0,document.getElementById('lookup').getBoundingClientRect().top);
	}

}
module.exports = initTable;