var cheerio = require('cheerio');
var request = require('request');
var css = require('css');
var async = require('async');
var url = require('url');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '334123',
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

function attachStyles($, style) {
	try {
		var obj = css.parse(style, {});

		function p(rule) {
			if (rule.selectors) {
				rule.selectors.forEach(function(sel) {
					//console.log(rule);
					var s = '';
					rule.declarations.forEach(function(d) {
						s += d.property + ': ' + d.value + '; ';
					});
					try {
						$(sel).each(function(i, elem) {
							var e = $(this);
							var oldStyle = e.data('styles') || '';
							oldStyle = oldStyle.trim();
							if (oldStyle && oldStyle[oldStyle.length - 1] != ';') {
								oldStyle += '; ';
							}
							e.data('styles', oldStyle + s);
							//$(this).attr('style')
							//console.log(oldStyle + s);
						});
					} catch (e) {
						//console.error(e);
						console.log('error with selector - ' + sel);
					}
	 			});
			}
		}

		obj.stylesheet.rules.forEach(function(r) {
			if (r.rules) {
				r.rules.forEach(function(rule) {
					p(rule);
				});
			} else {
				p(r);
			}
		});

	} catch (e) {
		return;
	}
	/*console.log(obj.stylesheet.rules[0]);
	console.log(obj.stylesheet.rules[1]);
	console.log(obj.stylesheet.rules[2]);
	console.log(obj.stylesheet.rules[3]);
	console.log(obj.stylesheet.rules[obj.stylesheet.rules.length-2]);*/
}

function processPage(urlPage, next) {
	console.log(urlPage);
	request(urlPage, function (err, response, html) {
	  if (!err && response.statusCode == 200) {
	  	$ = cheerio.load(html);
	  	var page  = {
	  		head: $($('head').get(0)).html(),
	  		url: urlPage
	  	};
	  	//console.log($('head').data('styles'));
	  	async.each($('link[rel="stylesheet"]'), function(elem, next2) {
	  		var sheetURL = url.resolve(urlPage, $(elem).attr('href'));
	  		request(sheetURL, function (err2, response2, style) {
	  			//console.log(html2);
	  			attachStyles($, style);
	  			next();
	  		});
	  	}, function() {
		  	$('style').each(function(i, elem) {
		  		var style = $(this).text();
		  		attachStyles($, style);
		  	});

			var query = connection.query('INSERT INTO page SET ?', page, function(err, result) {
				if (err) {
				  	console.error(err);
				}

				var page_id = result.insertId;

			    async.each($('*'), function(t, next3) {
			    	  var contents = $.html(t);
			    	  var e = $(t);
			    	  var inner = e.html();
			    	  e.empty();
			    	  var element = $.html(e);
			    	  var styles = e.data('styles');
			    	  console.log(styles);
			    	  e.data(styles, undefined);
					  console.log( $.html(t) );
					  console.log( t.tagName );
					  console.log();

					  var post  = {
					  	page: page_id,
					  	element: e,
					  	inner: inner,
					  	tag_name: t.tagName,
					  	contents: contents,
					  	style: styles
					  };

					  //getTagID(this.tagName);
					  var query = connection.query('INSERT INTO tag_usage SET ?', post, function(err, result) {
					  if (err) {
					  	console.error(err);
					  }
					  console.log(result);
					  next3();
					});
				}, function() {
					next2();
				});
		  	});
		}, next);
	  }
	});
}

connection.query('TRUNCATE tag_usage;', function(err, result) {
	if (err) {
		console.error(err);
	}




	//process('http://thehealthcareblog.com/blog/2015/03/25/the-real-story-of-how-i-sold-two-startups-the-chaos-afterwards-and-whats-next/');
	//processPage('https://en.wikipedia.org/wiki/Hypothetical_types_of_biochemistry');
	var pages = []; //['http://blog.detour.com/introducing-progressive-equity/'];

	request('https://news.ycombinator.com', function (err, response, html) {
	  if (!err && response.statusCode == 200) {
	    $ = cheerio.load(html);
	    $('td.title a').each(function(i, elem) {
			  console.log( $(this).text() + '\n' );
			  var url2 = $(this).attr('href');
			  pages.push(url2);
		});
	  }

	  async.each(pages, processPage, function() {
		process.exit(0);
	  });
	});

	
	/*process.nextTick(function() {
		connection.end();
	});*/
});