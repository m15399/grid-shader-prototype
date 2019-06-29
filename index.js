
class Point {
	constructor(x, y){
		this.x = x;
		this.y = y;
	}

	plus(p){
		return new Point(this.x + p.x, this.y + p.y);
	}
	minus(p){
		return new Point(this.x - p.x, this.y - p.y);
	}
	floored(){
		return new Point(Math.floor(this.x), Math.floor(this.y));
	}
	magnitude(){
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
}

class Rect {
	constructor(x, y, w, h){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	contains(p){
		return p.x >= this.x &&
			p.y >= this.y &&
			p.x < this.x + this.w &&
			p.y < this.y + this.h;
	}

	origin(){
		return new Point(this.x, this.y);
	}
}

class Color {
	constructor(rgba){
		this.rgba = [rgba[0], rgba[1], rgba[2], rgba[3]];
	}

	getFillStyle(){
		var c = this.rgba;
		return 'rgba(' + 
			Math.floor(c[0]*255) + ',' +
			Math.floor(c[1]*255) + ',' +
			Math.floor(c[2]*255) + ',' +
			c[3] + ')';
	}
}

class Grid {

	constructor(){
		this.gridSize = 64;
		this.gridWidth = canvas.height/this.gridSize;
		this.gridHeight = this.gridWidth;

		this.randomizeHeights();
	}

	randomizeHeights(){
		var hr = 1 / 2;

		if (this.gridHeights == undefined){
			this.gridHeights = [];

			for(var y = 0; y < this.gridHeight; y++){
				for (var x = 0; x < this.gridWidth; x++){
					this.gridHeights[this.gridWidth * y + x] = Math.random() * hr;
				}
			}
		}


		// for(var y = 0; y < this.gridHeight - 1; y++){
		// 	for (var x = 0; x < this.gridWidth; x++){
		// 		this.gridHeights[this.gridWidth * y + x] = 
		// 			this.gridHeights[this.gridWidth * (y+1) + x];
		// 	}
		// }

		// for (var x = 0; x < this.gridWidth; x++){
		// 	this.gridHeights[this.gridWidth * (this.gridHeight - 1) + x] = Math.random() * hr;
		// }

	}

	getHeight(gridCoordF){
		return this.gridHeights[this.gridWidth * gridCoordF.y + gridCoordF.x];
	}

	getRectOfCoord(gridCoordF){
		var c = gridCoordF;
		var h = this.getHeight(c);
		return new Rect(c.x - h, c.y - h, 1, 1);
	}

	colorOfCoord(gridCoordF){
		var x = gridCoordF.x;
		var y = gridCoordF.y;
		var maxX = this.gridWidth;

		if (x < 0) x = maxX;
		if (x > maxX) x = 0;
		if (y < 0) y = maxX;
		if (y > maxX) y = 0;

		var g = x/maxX;
		var b = y/maxX;
		var r = .8;
		if (x % 2 != 0) g*=1.3;
		if (y % 2 != 0) r*=1.3;

		var c = new Color([r, g, b, 1]);
		return c;
	}

	pixelCoordToGridCoord(x, y){
		var w = this.gridSize;
		x /= w;
		y /= w;

		y /= Math.sin(Math.PI/4);

		var a = Math.PI /-4;
		var s = Math.sin(a);
		var c = Math.cos(a);
		var newX = x * c - y * s;
		var newY = x * s + y * c;
		x = newX;
		y = newY;

		x += -280/w;
		y += 280/w;

		return new Point(x, y);
	}

	calculatePixel(x, y){
		var coord = this.pixelCoordToGridCoord(x, y);
		var coordF = coord.floored();

		var color = new Color([0, 0, 0, 0]);
		var darken = 1;

		var coordOffset = coord.minus(coordF);
		if (coordOffset.x < .02 || coordOffset.y < .02){
			// darken *= .8; // show grid
		}
		
		// Iterate through blocks that might be visible, e.g.
		//   down right block,
		//   down block,
		//   this block
		//
		// Stop of the first block that our coord could be in (this is the block closest to the camera).
		//
		var chosenCoord;
		var chosenRect;
		var pointList;
		if (coordOffset.x < coordOffset.y){
			pointList = [
				new Point(1, 1),
				new Point(0, 1),
				new Point(0, 0)
			];
		} else {
			pointList = [
				new Point(1, 1),
				new Point(1, 0),
				new Point(0, 0)
			];
		}

		for(var i = 0; i < pointList.length; i++){
			var checkCoord = coordF.plus(pointList[i]);
			var checkRect = this.getRectOfCoord(checkCoord);

			if (coord.x >= checkRect.x && coord.y >= checkRect.y){
				chosenCoord = checkCoord;
				chosenRect = checkRect;
				break;
			}
		}

		// We know which block we're drawing, now just pick the color.
		//
		if (chosenCoord){
			color = this.colorOfCoord(chosenCoord);
			var offset = coord.minus(chosenRect.origin());

			if (offset.x < 1 && offset.y < 1){
				// Top face
				//
				darken *= 1 - (1-offset.x)/4;
				darken *= 1 - (offset.y)/8;

			} else {
				var dist = Math.max(offset.x, offset.y);
				darken *= 1 - (dist-1)/2;

				if (offset.y > offset.x){
					// Bottom face
					//
					darken *= .6;
				} else {
					// Right face
					//
					darken *= .8;					
				}
			}			
		}


		for(var i = 0; i < 3; i++){
			color.rgba[i] *= darken;
		}
		return color.getFillStyle();
	}

	draw(){
		this.randomizeHeights();

		for(var y = 0; y < canvas.height; y++){
			for(var x = 0; x < canvas.width; x++){
				var fillStyle = this.calculatePixel(x, y);
				g.fillStyle = fillStyle;
				g.fillRect(x, y, 1, 1);
			}
		}
	}
}


//---------------------------------------------------------------------------

var canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
var g = canvas.getContext('2d');

var grid = new Grid();

function mouseDownHandler(e){
	var x = e.clientX;
	var y = e.clientY;

}
function mouseMoveHandler(e){
	var x = e.clientX;
	var y = e.clientY;

	var c = grid.pixelCoordToGridCoord(x, y);
	console.log(c.floored());
	// console.log(grid.gridHeights[cy * grid.gridWidth + cx]);

}
function mouseUpHandler(e){
	var x = e.clientX;
	var y = e.clientY;

}

function update(){
	g.fillStyle = 'black';
	g.fillRect(0, 0, canvas.width, canvas.height);

	grid.draw();
}

function main(){
	document.body.addEventListener('mousedown', mouseDownHandler);
	document.body.addEventListener('mousemove', mouseMoveHandler);
	document.body.addEventListener('mouseup', mouseUpHandler);
	
	// window.setInterval(update, 1000/3);
	update();
}

main();
