
/*
Demonstration code to parse data from iRealB dataset of jazz fake book chord charts. 
Format of input file is as follows:

=26-2=Coltrane John=Medium Up Swing=F=n=*A[T44F^7 Ab7  |Db^7 E7  |A^7 C7  |C-7 F7  
|Bb^7 Db7  |Gb^7 A7  |D-7 G7  |G-7 C7 ]*A[F^7 Ab7  |Db^7 E7  |A^7 C7  |C-7 F7  |Bb^7 Ab7  
|Db^7 E7  |A^7 C7  |F^7   ]*B[C-7 F7  |E-7 A7  |D^7 F7  |Bb^7    |Eb-7    |Ab7    |Db^7    
|G-7 C7 ]*A[F^7 Ab7  |Db^7 E7  |A^7 C7  |C-7 F7  |Bb^7 Ab7  |Db^7 E7  |A^7 C7  
|F^7   Z=500 Miles High=Corea Chick=Bossa Nova=E-=n=[T44E-7    | x   |G-7    | x   |Bb^7    
| x   |Bh7    |E7#9    |A-7    | x   |F#h7    | x   |F-7    | x Q  |C-7    | x   |B7#9    
| x  Z        Y{QC-7    | x   |Ab^7    | x  }=502 Blues=Rowles Jimmy=Waltz=A-=n={T34A-7    
|Db^7    |Bh7    |E7#9    |A-7    |Db^7    |Bh7    |E7#9    |C-7    |F7b9    |Bb^7    
|Ab-7 Db7  |N1F#h7    |B7b9    |E^7#5    |E^7#5 E7 } |N2F#h7    |B7b9    |E-7    
| x  Z=52nd Street Theme=Monk Thelonious=Up Tempo Swing=C=n={*AT44C A-7  |D-7 G7  
|C A-7  |D-7 G7  |C A-7  |D-7 G7  |C G7  |C   }[*BC7,    | x   |F6    | x   
|D7,    | x   |G7    | x  ][*AC, A-7  |D-7 G7  |C A-7  |D-7 G7  |C A-7  
|D-7 G7  |C G7  |C   Z =9.20 Special=Warren Earl=Medium Swing=C=n={*AT44C9,    
|Eb-6,    |C9,    |Eb-6    |Bb,    |sBb7,A7,Ab7,G7 |N1lC9, F#o7,  |C9, sAb7,G7}         
|N2lC9, F#o7  |lC9, sF7,Bb][*BlBb,    |Eb, Eb6  |Eb6,    | x   |G9,    |F, F6,  |F9,    
|  F7 ][*AC9,    |Eb-6,    |C9,    |Eb-6,    |Bb,    |sBb7,A7,Ab7,G7 |lC9, F#o7 , 
|sC6,F7,Bb,D9Z =A Felicidade=Jobim Antonio-Carlos=Bossa Nova=A-=n=*A{T44A-7(C^7)    
| x   |C^7    | x   |E-7    |B7b9    |E-7 <(Repeat Optional)>A7  |D-7 G7 }[*BC^7    
| x   |Bh7    |E7b9    |A-7    | x (Ab-7)  |G-7    |C7    |F^7    |D-7    |A-7    
|D7    |A-7    |Bh7 E7b9  |A-7    |G7   ]*C[C^7  |F7  |C^7  |x  |G-7  |C7  |F^7  
|x  |D-7  |G7  |C^7  |x  |F#h7  |B7b9  |sE-7,A7, |D-7,G7,]*D[lA-7    |A-7/G    
|D7/F#    |D-7/F    |A-7    |Bh7 E7b9  |A-7    | x  Z

*/

var fs = require('fs');
var mc = require('mongodb').MongoClient; //need to: npm install mongodb
var Set = require('./set.js'); 
var set = new Set();

// TODO: allow parsing of different file types (.xml)?
//var inputFilePath = "songs/sample_songs.txt";
//var inputFilePath = "songs/sample_songs2.txt";
var inputFilePath = "songs/1200iRealBookJazz_rev2.txt";
var outputFilePath = "songs/output.txt";

//parsing modes
//input mode changes when an '=' is found in data file
var MODES = {
UNKNOWN : 0,
TITLE: 1,   //parsing title of song
COMPOSER: 2, //parsing composer of song
STYLE: 3,  //parsing style of song
KEY: 4,  //parsing musical key of song
N: 5,     //place holder, no parsing
SONGDATA: 6 //parsing song chord data
};

//NOTE: location and name of song data file is hard-coded.
fs.readFile(inputFilePath , function(err, data) {
	if(err) {
		console.log('ERROR OPENING FILE: ' + inputFilePath);
		throw err; 
	} 

	console.log('PARSING FILE: ' + inputFilePath);

	var fileDataString = data.toString(); //all data from file

	var mode = MODES.UNKNOWN;  //current parsing mode
	var parseDataString = ""; //parse data for current mode
	var rawSongDataString = ""; //raw data for song kept for debugging for now
	var currentSong = {}; //current songs being constructed
	var currentBar = null; //current bar being constructed
	var numberOfBars = 0; // start at bar 0

	var songsArray = []; //array of parsed songs

	function isEmptyObject(anObject){
		//answer whether anObject is empty
		for (var item in anObject)
			if(anObject.hasOwnProperty(item)) return false;
		return true;
	}
  
	function setMode(newMode){
		//now leaving mode
		if (mode === MODES.TITLE){ 
			currentSong.title = parseDataString;
		}
		else if (mode === MODES.COMPOSER) {
			currentSong.composer = parseDataString;
		}
		else if (mode === MODES.STYLE) {
			currentSong.style = parseDataString;
		}
		else if (mode === MODES.KEY) {
			currentSong.key = parseDataString;
		}
		else if (mode === MODES.SONGDATA) {
			numberOfBars = 0;
			currentSong.songData = parseDataString;
			currentSong.rawSongData = rawSongDataString;
		}
		
		//now entering mode
		if (newMode === MODES.SONGDATA) {
			currentSong['bar' + numberOfBars] = []; // starting at bar 0
		}
		else if (newMode === MODES.TITLE) {
			if (!isEmptyObject(currentSong))
				songsArray.push(currentSong);
			currentSong = {}; //make new empty song;
		}
		
		mode = newMode;
		parseDataString = ""; 
		rawSongDataString = "";
	}
	  
	function isBarLine(x){ 
		if(x === "|") return true; //bar line
		if(x === "[") return true; //left double bar line
		if(x === "]") return true; //right double bar line
		if(x === "{") return true; //left repeat bar line
		if(x === "}") return true; //right repeat bar line
		if(x === "Z") return true; //final bar line
		return false;
	}

	//parse the file data into song objects with bars.
	//each bar contains crude chord data including chords, time signatures
	//rehearsal letters etc.
	for (var i = 0; i < fileDataString.length; i++) {
		if (fileDataString.charAt(i) == "="){
			//change parsing mode
			if (mode === MODES.UNKNOWN) setMode(MODES.TITLE);
			else if (mode === MODES.TITLE) setMode(MODES.COMPOSER);
			else if (mode === MODES.COMPOSER) setMode(MODES.STYLE);
			else if (mode === MODES.STYLE) setMode(MODES.KEY);
			else if (mode === MODES.KEY) setMode(MODES.N);
			else if (mode === MODES.N) setMode(MODES.SONGDATA);
			else if (mode === MODES.SONGDATA) setMode(MODES.TITLE);
		}
		else if ((mode === MODES.SONGDATA) && isBarLine(fileDataString.charAt(i))) {
			if (currentBar === null) {
				currentBar = {}; 
				if (fileDataString.charAt(i) === "[") currentBar.leftDoubleBarLine = true;
				if (fileDataString.charAt(i) === "{") currentBar.leftRepeat = true;
			}
			else {
				var section = parseDataString.indexOf("*");
				var time = parseDataString.indexOf("T");
				var ending = parseDataString.indexOf("N");
				var repeatOne = parseDataString.indexOf("x");
				var repeatTwo = parseDataString.indexOf("r");
				var coda = parseDataString.indexOf("Q");
				var segno = parseDataString.indexOf("S");

				if (section != -1) {
					currentBar.rehearsalLetter = parseDataString.charAt(section+1);									// should display [A]
					parseDataString = parseDataString.replace("*", " ");
					if (parseDataString.charAt(section+1).toLowerCase() === "i") currentBar.rehearsalLetter = "intro"; // special case for intro
					parseDataString = parseDataString.replace(parseDataString.charAt(section+1), " ");
				}
				
				if (time != -1)	{
					currentBar.timeSignature = parseDataString.charAt(time+1) + '/' + parseDataString.charAt(time+2);	// should display 4/4
					parseDataString = parseDataString.replace(parseDataString.charAt(time), " ");
					parseDataString = parseDataString.replace(parseDataString.charAt(time+1), " ");
					parseDataString = parseDataString.replace(parseDataString.charAt(time+2), " ");
				}
				
				if (ending != -1) {
					if (parseDataString.charAt(ending+1) === "1") currentBar.firstEnding = true;						// should display (1.		
					else if (parseDataString.charAt(ending+1) === "2") currentBar.secondEnding = true;				// should display (2.
					else if (parseDataString.charAt(ending+1) === "3") currentBar.thirdEnding = true;					// should display (3.
					parseDataString = parseDataString.replace(parseDataString.charAt(ending), " ");
					parseDataString = parseDataString.replace(parseDataString.charAt(ending+1), " ");
				}
				
				// TODO: add leftSingleBarLine if necessary
				// TODO: add parsing for no chords in a bar (nc)
				
				if (repeatOne != -1) { 
					currentBar.oneRepeat = true;
					parseDataString = parseDataString.replace(parseDataString.charAt(repeatOne), "%");
				}
				
				if (repeatTwo != -1) { 
					currentBar.twoRepeat = true;
					parseDataString = parseDataString.replace(parseDataString.charAt(repeatTwo), "%2");
				}
				
				if (coda != -1) {
					currentBar.coda = true;
				}
				if (segno != -1) currentBar.segno = true;
				
				currentBar.chords = parseDataString.trim(); // may need to be moved
				currentSong['bar' + numberOfBars] = currentBar; // may need to be moved
				
				if (fileDataString.charAt(i) === "]") currentBar.rightDoubleBarLine = true;
				if (fileDataString.charAt(i) === "|") currentBar.rightSingleBarLine = true;
				if (fileDataString.charAt(i) === "}") currentBar.rightRepeat = true;
				if (fileDataString.charAt(i) === "Z") currentBar.finalBarLine = true;
				
				if (fileDataString.charAt(i) === "]") currentBar = null;
				else if (fileDataString.charAt(i) === "}") currentBar = null;
				else currentBar = {};
			
				numberOfBars++;
				parseDataString = "";
			}
			rawSongDataString = rawSongDataString + fileDataString.charAt(i);
		}
		else {
			//add data character to content for mode
			parseDataString = parseDataString + fileDataString.charAt(i);
			rawSongDataString = rawSongDataString + fileDataString.charAt(i);
		}
	} //end parse data file

	//account for last song which will not go back to TITLE mode
	if(!isEmptyObject(currentSong)) {
		currentSong.rawSongData = rawSongDataString;
		currentSong.songData = parseDataString;	 
		songsArray.push(currentSong);
	}
	currentSong = {}; //make new empty song;
	currentBar = null; //clear current bar;
	//write parsed songs to console
	//console.log(songsArray);
	console.log('THE SET');
	console.log(set.toString());

	//write parsed songs to output file.
	//write the array as a stringified JSON object.
	var dataAsObject = {};
	dataAsObject.songs = songsArray;

	fs.writeFile(outputFilePath , JSON.stringify(dataAsObject, null, 2), function(err){
		if(err) console.log(err);
		else console.log('file was saved to: ' + outputFilePath);
	});
  
	mc.connect('mongodb://localhost/iRealSongs', function(err, db) {
		if (err) throw err;
		var songsCollection = db.collection('songs');

		songsCollection.drop(function(err, count) {
			if (err) console.log("No collection to drop.");
			else console.log("songs collection dropped.");
			songsCollection.insert(songsArray, function(err, theSongs) {
				if (err) throw err;
				//theSongs.forEach(function(aSong) {
				//console.log("Added " + aSong.title);
				//});
				db.close();
		   });
		});
	});
});
