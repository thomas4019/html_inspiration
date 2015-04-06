var cheerio = require('cheerio');
var request = require('request');


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'html_obs'
});

connection.connect();

var tags = {};



function getTagID(tag_name, callback) {
	if (tags[tag_name]) {
		return tags[tag_name];
	}

	var post  = {name: tag_name};
	var query = connection.query('INSERT INTO tag SET ?', post, function(err, result) {
	  if (err) {
	  	console.error(err);
	  }
	  //console.log(result);
	  tags[tag_name] = result.insertId;
	});
	tags[tag_name] = -1;
}

function processPage(url) {
	request(url, function (err, response, html) {
	  if (!err && response.statusCode == 200) {
	  	$ = cheerio.load(html);
	  	var page  = {
	  		head: $($('head').get(0)).html(),
	  		url: url
	  	};
		var query = connection.query('INSERT INTO page SET ?', page, function(err, result) {
			if (err) {
			  	console.error(err);
			}

			var page_id = result.insertId;

		    $('*').each(function(i, elem) {
		    	  var contents = $.html(this);
		    	  var e = $(this);
		    	  var inner = e.html();
		    	  e.empty();
		    	  var element = $.html(e);
				  console.log( $.html(this) + '\n' );
				  console.log( $.html(this) + '\n' );
				  console.log( this.tagName + '\n' );

				  var post  = {
				  	page: page_id,
				  	element: e,
				  	inner: inner,
				  	tag_name: this.tagName,
				  	contents: contents
				  };

				  //getTagID(this.tagName);
				var query = connection.query('INSERT INTO tag_usage SET ?', post, function(err, result) {
				  if (err) {
				  	console.error(err);
				  }
				});
			});
		});
	  }
	});
}

connection.query('TRUNCATE tag_usage;', function(err, result) {
	request('https://news.ycombinator.com', function (err, response, html) {
	  if (!err && response.statusCode == 200) {
	    $ = cheerio.load(html);
	    $('td.title a').each(function(i, elem) {
			  console.log( $(this).text() + '\n' );
			  var url = $(this).attr('href');
			  processPage(url);
		});
	  }
	});


	//process('http://thehealthcareblog.com/blog/2015/03/25/the-real-story-of-how-i-sold-two-startups-the-chaos-afterwards-and-whats-next/');
	//processPage('https://en.wikipedia.org/wiki/Hypothetical_types_of_biochemistry');
	/*process.nextTick(function() {
		connection.end();
	});*/
});