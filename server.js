var _ = require('lodash');
var express = require('express');
var app = express();

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '334123',
  database : 'html_obs'
});

connection.connect();

app.get('/tags', function(req, res){
	connection.query('SELECT DISTINCT(tag_name) FROM tag_usage ORDER BY tag_name ASC;', function(err, result) {
	  if (err) {
	  	console.error(err);
	  }
	  var result2 = _.map(result, function(currentObject) {
		return currentObject["tag_name"];
	  });

	  res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result2));
	});
});

app.get('/tag_usage/:tagName', function(req, res){
	connection.query('SELECT * FROM tag_usage WHERE tag_name=?;', req.params["tagName"], function(err, result) {
	  if (err) {
	  	console.error(err);
	  }

	  res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
	});
});

app.get('/page/:id', function(req, res){
	connection.query('SELECT * FROM page WHERE id=?;', req.params["id"], function(err, result) {
	  if (err) {
	  	console.error(err);
	  }

	  res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result[0]));
	});
});

app.use(express.static(__dirname + '/public'));

app.listen(3000);
