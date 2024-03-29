var MongoClient = require('mongodb').MongoClient;
//var Server = require('mongodb').Server;
var songCollection;
var searchQuery;
var searchFilter;
var searchResults; // cursor
var idArray = [];
var resultArray = [];

var connectToDBs = function(callback) {
	MongoClient.connect('mongodb://localhost/iRealSongs/', function(err, db) {
		if (err) throw err;
		console.log("Connected to Database.");
		songColletion = db.collection('songs');
		callback();
	});
}

function index(req, res) {
	resultsArray = [];
	res.render('index', {	title: 'Song Chord Viewer',
							error: req.query.error});					
}

function search(req, res) {
	searchQuery = req.body.query.split(' ');
	searchFilter = req.body.filter;
	var query;
	
	if (req.body.query.length > 0) {
		if (searchFilter == 1) { // title
			query = {title: searchQuery[0]}; // hard code for testing
			MongoClient.connect('mongodb://localhost/iRealSongs/', function(err, db) {
				if (err) throw err;
				console.log("Connected to Database.");
				songColletion = db.collection('songs');
				songCollection.find(query, function(err, cursor) {
					cursor.each(function(err, doc) {
						if (doc == null) {
							res.render('search', { 	title:		'Search Results',
													error:		req.query.error,
													results:	resultArray});
							resultArray = [];
						}
						else {
							resultArray.push(doc);
						}
					});
				});
			});			
		}
		else if (searchFilter == 2) {
			query = {composer: req.body.query}; // hard code for testing
			MongoClient.connect('mongodb://localhost/iRealSongs/', function(err, db) {
				if (err) throw err;
				songCollection = db.collection('songs');
				songCollection.find(query, function(err, cursor) {
					cursor.each(function(err, doc) {
						if (doc == null) {
							res.render('search', { 	title:		'Search Results',
													error:		req.query.error,
													results:	resultArray});
							resultArray = [];
						}
						else {
							resultArray.push(doc);
						}
					});
				});
			});
		}
		else if (searchFilter == 3) { // Style
			query = {style: req.body.query}; // hard code for testing
			MongoClient.connect('mongodb://localhost/iRealSongs/', function(err, db) {
				songCollection.find(query, function(err, cursor) {
					cursor.each(function(err, doc) {
						if (doc == null) {
							res.render('search', { 	title:		'Search Results',
													error:		req.query.error,
													results:	resultArray});
							resultArray = [];
						}
						else {
							resultArray.push(doc);
						}
					});
				});
			});
		}
		else {
			console.log("Error with filter");
		}
	}
	else { // display all TODO: limit to 12/page
		MongoClient.connect('mongodb://localhost/iRealSongs/', function(err, db) {
			songCollection.find(function(err, cursor) {
				cursor.each(function(err, doc) {
					if (doc == null) {
						res.render('search', { 	title:		'Search Results',
												error:		req.query.error,
												results:	resultArray});
						resultArray = [];
					}
					else {
						resultArray.push(doc);
					}
				});
			});
		});
	}
}

function song(req, res) {
	// TODO: should render selected song 
}

function getSongs() {
	MongoClient.connect('mongodb://localhost/iRealSongs/', function(err, db) {
		songCollection.find(function(err, cursor) {
			cursor.each(function(err, doc) {
				if (doc == null) return idArray;
				idArray.push(doc['_id']);
			});
		});
	});
}

exports.index = index;
exports.search = search;
exports.song = song;
exports.getSongs = getSongs;
exports.connectToDBs = connectToDBs;
