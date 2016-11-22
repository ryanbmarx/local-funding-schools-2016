var fs = require('fs'),
  request = require('request');

var url = "https://docs.google.com/spreadsheets/d/16edmCtUOoWm2Q-AQnS8gLt13QZd2KEF3dHTwDe73k2Q/pub?gid=88334663&single=true&output=csv";
request
  .get(url)
  .on('error', function(err) {
    // handle error
  })
  .pipe(fs.createWriteStream('./data/schools-data.csv'));