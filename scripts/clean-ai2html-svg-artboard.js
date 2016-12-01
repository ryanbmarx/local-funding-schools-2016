
var fs = require('fs'),
    cheerio = require('cheerio'),
    dir = process.argv[2];

    console.log(`>>> Cleaning up SVGs in ${dir}`);

    // open up desired dir.
    fs.readdir(dir, function(err, files){
        if (err) throw err;
        files.forEach(file =>{
            if(file.split('.')[1] == "svg"){
                var fn = `${dir}/${file}`;
                cleanSVGArtboard(fn);
            }
        })
    })


function cleanSVGArtboard(svgFileName, svg_embed_images) {
    if (!fs.existsSync(svgFileName)) return;
    var svgText = fs.readFileSync(svgFileName, 'utf-8');

    if (svgText.indexOf('non-scaling-stroke') > -1) {
        // already cleaned
        return;
    }

    svgText = svgText.replace('xml:space="preserve">',
        'xml:space="preserve">\n\t<style>\n\t\tpath,line,circle,rect,polygon { vector-effect: non-scaling-stroke }\n\t</style>\n');

    svgText = svgText.replace(/style="display:none/g, 'data-hide="1" style="display:none');
    
    var $ = cheerio.load(svgText, {normalizeWhitespace: true, xmlMode: true});

    $('*[data-hide=1]').remove();
    $('text').remove();
    if (!svg_embed_images) $('image').remove();

    // remove three levels of empty divs
    $('g:empty').remove();
    $('g:empty').remove();
    $('g:empty').remove();

    fs.writeFileSync(svgFileName, $.xml(), 'utf8');
    // console.log('cleaned ' + svgFileName);
    return;

}
