var table;

var defaultWidth = 10;
var defaultHeight = 10;
var defaultTurns = 48;

var startTime = -1;
var timer;

var turnsLeft = -1;

$(document).ready(function() {
	
	var defaultTime = $('#timer').html();
	
	$('.reset').click(function() {
		wipeTable();
		generateTable();
		$('.screen-overlay').removeClass('show');
		stopTimer();
		$('#timer').html(defaultTime);
	});
	
	$('.close').click(function() {
		$('.screen-overlay').removeClass('show');
	});
	
	//.on is needed because .click does not work with dynamic elements
	$('#ship-table').on('click', '.tile', function() {
		if (startTime == -1) {
			startTime = new Date().getTime();
			getRunningTime();
			timer = setInterval(getRunningTime, 1000);
		}
		
		var clickedTile = $(this).attr('id').split('_');
		table.getTileAt(clickedTile[0], clickedTile[1]).click();
		// TODO
		if (turnsLeft == 0 && !table.allShipsSunk()) {
			stopTimer();
			$('#losing').addClass('show');
		} else if (table.allShipsSunk()) {
			stopTimer();
			$('#winning').addClass('show');
		}
	});
	
	$('#timer').on('click', '#cheat', function() {
		if ($('#cheat-style').length) {
			$('#cheat-style').remove();
		} else {
			$('head').append(`<style id="cheat-style">
				.ship0 {
					background-color: white;
				}

				.ship1 {
					background-color: blue;
				}

				.ship2 {
					background-color: green;
				}

				.ship3 {
					background-color: black;
				}

				.ship4 {
					background-color: red;
				}</style>`);
		}
	});
	
	wipeTable();
	generateTable();
	
});

function getRunningTime() {
	var currTime = new Date().getTime();
	var diff = millisToTime(currTime - startTime, 'minutes');
	//console.log(diff);
	
	$('#timer').html(diff);
}

function millisToTime(millis, leadingZero) {
	var seconds = Math.floor((millis/1000) % 60);
	var minutes = Math.floor((millis/60000) % 60 );
	var hours = Math.floor((millis/(3600000)) % 24 );
	
	if (leadingZero == 'all') {
		return zeroPad(hours, 2) + ":" + zeroPad(minutes, 2) + ":" + zeroPad(seconds, 2);
	} else if (leadingZero == 'minutes') {
		return zeroPad(minutes, 2) + ":" + zeroPad(seconds, 2);
	} else {
		if (hours > 0) {
			return zeroPad(hours, 2) + ":" + zeroPad(minutes, 2) + ":" + zeroPad(seconds, 2);
		} else if (minutes > 0) {
			return zeroPad(minutes, 2) + ":" + zeroPad(seconds, 2);
		} else {
			return zeroPad(seconds, 2);
		}
	}
}

// from http://stackoverflow.com/a/2998874
function zeroPad(num, places) {
	var zero = places - num.toString().length + 1;
	return Array(+(zero > 0 && zero)).join("0") + num;
}

function stopTimer() {
	clearInterval(timer);
	startTime = -1;
}

//clears the table
function wipeTable() {
	turnsLeft = defaultTurns;
	$('#counter').html(turnsLeft);
	$('#ship-table').html('');
}

//creates a new table
function generateTable() {
	table = new Table(defaultWidth, defaultHeight);
	table.generateShips();
	table.output();
}

var Table = function(w, h) {
	var width = w;
	var height = h;
	var tiles = [];
	var ships = [];
	
	// generates tiles
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			tiles[tiles.length] = new Tile(x, y);
		}
	}
	
	// generates ships
	this.generateShips = function() {
		ships[ships.length] = new Ship(ships.length, 5);
		ships[ships.length] = new Ship(ships.length, 4);
		ships[ships.length] = new Ship(ships.length, 3);
		ships[ships.length] = new Ship(ships.length, 3);
		ships[ships.length] = new Ship(ships.length, 2);
		
		for (var i = 0; i < ships.length; i++) {
			ships[i].generate();
		}
	}
	
	this.allShipsSunk = function() {
		for (var s = 0; s < ships.length; s++) {
			if (ships[s].isSunk() == false) {
				return false;
			}
		}
		return true;
	}
	
	this.getTileAt = function(x, y) {
		return tiles[(y * width) + (x * 1)];
	}
	
	this.getTile = function(id) {
		return tiles[id];
	}
	
	this.output = function() {
		// TODO
		var html = '<div class="tilerow">';
		var lastY = 0;
		for (var t = 0; t < tiles.length; t++) {
			var tile = tiles[t];
			if (tile.getY() != lastY) {
				html += '</div><div class="tilerow">';
			}
			
			html += tile.getCode();
			
			lastY = tile.getY();
		}
		html += '</div>';
		$('#ship-table').append(html);
		console.log("rendering table");
	}
}

var Tile = function(x1, y1) {
	var x = x1;
	var y = y1;
	var clicked = false;
	var ship;
	
	this.getCoords = function() {
		return [x, y];
	}
	
	this.getX = function() {
		return x;
	}
	
	this.getY = function() {
		return y;
	}
	
	this.wasClicked = function() {
		return clicked;
	}
	
	this.click = function() {
		if (!clicked) {
			clicked = true;
			if (this.getShip()) {
				ship.hit(x, y);
				$('#' + this.getID()).addClass('hit');
			} else {
				$('#' + this.getID()).addClass('missed');
			}
			turnsLeft--;
			$('#counter').html(turnsLeft);
			return true;
		} else {
			return false;
		}
	}
	
	this.setShip = function(shipObj) {
		ship = shipObj;
	}
	
	this.getShip = function() {
		if (ship == null) {
			return false;
		}
		return ship;
	}
	
	this.getID = function() {
		return x + '_' + y;
	}
	
	this.getCode = function() {
		var shipID = -1;
		if (this.getShip() != false) {
			shipID = ship.getID();
		}
		return '<div class="tile ship' + shipID + '" id="' + this.getID() + '">' +
			'</div>';
	}
}

var Ship = function(ident, length) {
	var id = ident;
	var size = length;
	var coords = [];
	var direction;
	var hits = [];
	var self = this;
	
	this.getSize = function() {
		return size;
	}
	
	this.getID = function() {
		return id;
	}
	
	this.getCoords = function() {
		return coords;
	}
	
	this.getHits = function() {
		return hits;
	}
	
	this.hit = function(x, y) {
		for (var i = 0; i < coords.length; i++) {
			if (coords[i].x == x && coords[i].y == y) {
				hits[hits.length] = {
					'x': x,
					'y': y
				};
			}
		}
		if (this.isSunk()) {
			console.log('Ship ' + id + ' was sunk');
		}
	}
	
	this.isSunk = function() {
		if (hits.length == coords.length) {
			return true;
		}
		return false;
	}
	
	this.generate = function() {
		console.log("attempting to generate ship " + id);
		do {
			direction = Math.floor(Math.random() * 2);
			var row, col;
			
			if (direction == 1) {
				row = Math.floor(Math.random() * defaultWidth);
				col = Math.floor(Math.random() * (defaultHeight - length + 1));
			} else {
				row = Math.floor(Math.random() * (defaultWidth - length + 1));
				col = Math.floor(Math.random() * defaultHeight);
			}
			
			for (var i = 0; i < size; i++) {
				if (direction == 1) {
					coords[i] = {
						'x': row,
						'y': col + i
					};
				} else {
					coords[i] = {
						'x': row + i,
						'y': col
					};
				}
			}
		} while(isColliding());
		
		for (var c = 0; c < coords.length; c++) {
			table.getTileAt(coords[c].x, coords[c].y).setShip(this);
		}
	}
	
	var isColliding = function() {
		for (var c = 0; c < coords.length; c++) {
			if (table.getTileAt(coords[c].x, coords[c].y).getShip()) {
				console.log("ship is colliding, trying again");
				return true;
			}
		}
		return false;
	}
	
} 
