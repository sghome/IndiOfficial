function waveForm(dataArray, bufferLength){

	//analyser.fftSize = 1024; //defines Fast Fourier Transform rate

	canvasCtx.clearRect(0,0,canvWidth,canvHeight); //reset canvas for new vis

	function draw(){
		drawVisual = requestAnimationFrame(draw); //this keeps looping the drawing function once it has started

		var dataArray = new Uint8Array(fftSampleSize);
    	fft.getByteTimeDomainData(dataArray);

		canvasCtx.fillStyle = bgColor;
		canvasCtx.fillRect(0,0, canvWidth, canvHeight);

		//line width and color
		canvasCtx.lineWidth = 2;
			canvasCtx.beginPath();

		//width of ea. segment = canv.w / arraylength
		var sliceWidth = canvWidth * 1.0 / dataArray.length; //bufferLength;
			var x = 0; //position to move to to draw ea. line segment

		for(var i=0; i <dataArray.length; i++){
			var v = dataArray[i] / 128.0; //128.0 height based on the data point value form the array
			canvasCtx.strokeStyle = 'hsl('+ dataArray[i]*5 +',80%,70%)';
			var y = v * canvHeight/2;

			if(i===0){
				canvasCtx.moveTo(x,y); // moving the line across to the place where the next wave segment should be drawn
			}else{
				canvasCtx.lineTo(x,y);
			}
			x += sliceWidth;
		}

		canvasCtx.lineTo(canvWidth, canvWidth/2);
			canvasCtx.stroke();
	}
		draw();
}


function chladniPlate(dataArray, bufferLength){

	var rodPart = new RodParticle();
	var dashPart = new DashParticle();
	var dotPart = new DotParticle();

	var Attractor = (function(x, y){

		this.x = x;
		this.y = y;
		this.radius = 200; //radius of impact
		this.strength = 1; //+ for attraction, - for repulsion
		this.ramp = 0.5; // form of function
		this.mode = 'basic';

		this.attract = function(node){
			var dx = this.x - node.x;
			var dy = this.y - node.y;
			var d = Math.sqrt(
					Math.pow(dx, 2) + Math.pow(dy, 2)
				);
			var f = 0;

			switch(this.mode){
				case 'basic':
					if(d > 0 && d < this.radius){
						//calc force
						var s = d/this.radius;
						f = (1 / Math.pow(s, 0.5*this.ramp) -1);
						f = this.strength * f / this.radius;
					}
					break;
				case 'smooth': // Fallthrough
				case 'twirl':
					if(d > 0 && d < this.radius){
						var s = Math.pow(d/this.radius, 1/this.ramp);
						f = s * 9 * this.strength * (1 / (s + 1) + ((s-3) /4)) /d;
					}
					break;
				default:
					f = null;
			}

			//apply force
			if(this.mode !== 'twirl'){
				node.velocity.x += dx * f;
				node.velocity.y += dy * f;
			}
			else{
				node.velocity.x += dx * f;
				node.velocity.y -= dy * f;
			}
		};
	});

	var Node = (function(x, y){

		this.type = null;
		this.minX = 5;
		this.minY = 5;
		this.maxX = canvWidth-5;
		this.maxY = canvHeight-5;
		this.damping = 0.1;
		this.x = x;
		this.y = y;
		this.velocity = {
			x: null,
			y: null
		};

		this.update = function(){

			this.x += this.velocity.x;
			this.y += this.velocity.y;

			if(this.x < this.minX){
				this.x = this.minX - (this.x - this.minX);
				this.velocity.x *= -1;
			}

			if(this.x > this.maxX){
				this.x = this.maxX - (this.x - this.maxX);
				this.velocity.x *= -1;
			}

			if(this.y < this.minY){
				this.y = this.minY - (this.y - this.minY);
				this.velocity.y *= -1;
			}

			if(this.y > this.maxY){
				this.y = this.maxY - (this.y - this.maxY);
				this.velocity.y *= -1;
			}

			this.velocity.x *= (1-this.damping);
			this.velocity.y *= (1-this.damping);
		};

		this.setBoundary = function(minX, minY, maxX, maxY){
			this.minX = minX;
			this.minY = minY;
			this.maxX = maxX;
			this.maxY = maxY;
		};

		this.setDamping = function(newDamping){
			this.damping = newDamping;
		};
	});

	//Runtime UI stuff
	var visSettings	= document.getElementById('vis-settings');
		visSettings.style.display = 'block';

	var nodeDampingInput = document.createElement('input');
		nodeDampingInput.type = 'range';
		nodeDampingInput.id = 'nodeDampingInput';
		nodeDampingInput.className = 'vis-setting';
		nodeDampingInput.min = 0;
		nodeDampingInput.max = 100;
		nodeDampingInput.value = 5; //need to be /100 for 0.8
		var nodeDampingLabel = document.createElement('label');
			nodeDampingLabel.htmlFor = 'nodeDampingInput';
			nodeDampingLabel.innerHTML = 'Node Damping';
			nodeDampingLabel.className = 'vis-setting';

	var basicDiv = document.createElement('div');
		basicDiv.className = 'vis-setting switch';
		var basicModeInput = document.createElement('input');
			basicModeInput.id = 'basicModeInput';
			basicModeInput.type = 'radio';
			basicModeInput.name = 'attractMode';
			basicModeInput.className = 'vis-setting switch-input';
		var basicModeLabel = document.createElement('label');
			basicModeLabel.htmlFor = 'basicModeInput';
			basicModeLabel.innerHTML = 'Basic Mode';
			basicModeLabel.className = 'vis-setting';
		var basicModePaddel = document.createElement('label');
			basicModePaddel.className = 'vis-setting switch-paddle';
			basicModePaddel.htmlFor = 'basicModeInput';

	var smoothDiv = document.createElement('div');
		smoothDiv.className = 'vis-setting switch';
		var smoothModeInput = document.createElement('input');
			smoothModeInput.id = 'smoothModeInput';
			smoothModeInput.type = 'radio';
			smoothModeInput.name = 'attractMode';
			smoothModeInput.className = 'vis-setting switch-input';
			smoothModeInput.checked = true;
		var smoothModeLabel = document.createElement('label');
			smoothModeLabel.htmlFor = 'smoothModeInput';
			smoothModeLabel.innerHTML = 'Smooth Mode';
		var smoothModePaddel = document.createElement('label');
			smoothModePaddel.className = 'vis-setting switch-paddle';
			smoothModePaddel.htmlFor = 'smoothModeInput';

	var twistDiv = document.createElement('div');
		twistDiv.className = 'vis-setting switch';
		var twistModeInput = document.createElement('input');
			twistModeInput.id = 'twistModeInput';
			twistModeInput.type = 'radio';
			twistModeInput.name = 'attractMode';
			twistModeInput.className = 'vis-setting switch-input';
			// twistModeInput.checked = true;
		var twistModeLabel = document.createElement('label');
			twistModeLabel.htmlFor = 'twistModeInput';
			twistModeLabel.innerHTML = 'Twist Mode';
		var twistModePaddel = document.createElement('label');
			twistModePaddel.className = 'vis-setting switch-paddle';
			twistModePaddel.htmlFor = 'twistModeInput';

	var lineDiv = document.createElement('div');
		lineDiv.className = 'vis-setting switch';
		var lineModeInput = document.createElement('input');
			lineModeInput.id = 'lineModeInput';
			lineModeInput.type = 'radio';
			lineModeInput.name = 'drawMode';
			lineModeInput.className = 'vis-setting switch-input';
			lineModeInput.checked = true;
		var lineModeLabel = document.createElement('label');
			lineModeLabel.htmlFor = 'lineModeInput';
			lineModeLabel.innerHTML = 'Draw Lines';
			lineModeLabel.className = 'vis-setting';
		var lineModePaddel = document.createElement('label');
			lineModePaddel.className = 'vis-setting switch-paddle';
			lineModePaddel.htmlFor = 'lineModeInput';

	var circleDiv = document.createElement('div');
		circleDiv.className = 'vis-setting switch';
		var circleModeInput = document.createElement('input');
			circleModeInput.id = 'circleModeInput';
			circleModeInput.type = 'radio';
			circleModeInput.name = 'drawMode';
			circleModeInput.className = 'vis-setting switch-input';
		var circleModeLabel = document.createElement('label');
			circleModeLabel.htmlFor = 'circleModeInput';
			circleModeLabel.innerHTML = 'Draw Circles';
			circleModeLabel.className = 'vis-setting';
		var circleModePaddel = document.createElement('label');
			circleModePaddel.className = 'vis-setting switch-paddle';
			circleModePaddel.htmlFor = 'circleModeInput';

	var attractRadiusInput = document.createElement('input');
		attractRadiusInput.type = 'range';
		attractRadiusInput.id = 'attractRadiusInput';
		attractRadiusInput.className = 'vis-setting';
		attractRadiusInput.min = 0;
		attractRadiusInput.max = 20;
		attractRadiusInput.value = attractRadiusInput.max/2;
		var attractRadiusLabel = document.createElement('label');
			attractRadiusLabel.htmlFor = 'attractRadiusInput';
			attractRadiusLabel.innerHTML = 'Attraction Radius';
			attractRadiusLabel.className = 'vis-setting';

	var attractStrengthInput = document.createElement('input');
		attractStrengthInput.type = 'range';
		attractStrengthInput.id = 'attractStrengthInput';
		attractStrengthInput.className = 'vis-setting';
		attractStrengthInput.min = 0;
		attractStrengthInput.max = 200;
		attractStrengthInput.value = 37;
		var attractStrengthLabel = document.createElement('label');
			attractStrengthLabel.htmlFor = 'attractStrengthInput';
			attractStrengthLabel.innerHTML = 'Attraction Strength';
			attractStrengthLabel.className = 'vis-setting';

	var attractRampInput = document.createElement('input');
		attractRampInput.type = 'range';
		attractRampInput.id = 'attractRampInput';
		attractRampInput.className = 'vis-setting';
		attractRampInput.min = 0.1;
		attractRampInput.max = 5;
		attractRampInput.value = 1; //need to be /100 for 0.2
		var attractRampLabel = document.createElement('label');
			attractRampLabel.htmlFor = 'attractRampInput';
			attractRampLabel.innerHTML = 'Attraction Ramp';
			attractRampLabel.className = 'vis-setting';

		basicDiv.appendChild(basicModeLabel);
		basicDiv.appendChild(basicModeInput);
		basicDiv.appendChild(basicModePaddel);
		smoothDiv.appendChild(smoothModeLabel);
		smoothDiv.appendChild(smoothModeInput);
		smoothDiv.appendChild(smoothModePaddel);
		twistDiv.appendChild(twistModeLabel);
		twistDiv.appendChild(twistModeInput);
		twistDiv.appendChild(twistModePaddel);
	visSettings.appendChild(basicDiv);
	visSettings.appendChild(smoothDiv);
	visSettings.appendChild(twistDiv);
	visSettings.appendChild(nodeDampingLabel);
	visSettings.appendChild(nodeDampingInput);
	visSettings.appendChild(attractRadiusLabel);
	visSettings.appendChild(attractRadiusInput);
	visSettings.appendChild(attractStrengthLabel);
	visSettings.appendChild(attractStrengthInput);
	visSettings.appendChild(attractRampLabel);
	visSettings.appendChild(attractRampInput);

	var xCount = canvWidth/100; //15;
	var yCount = canvHeight/100; //15;
	var gridStepX = canvWidth/xCount;
	var gridStepY = canvHeight/yCount;

	var nodeDamping;
	var attractor, nodes;

	$(window ).resize(function() {
  		init();
	});

	function init(){

		xCount = canvWidth/100; //15;
		yCount = canvHeight/100; //15;

		attractor = new Attractor(canvWidth/2, canvHeight/2);
		nodes = [];

		canvasCtx.lineWidth = 1;
		canvasCtx.strokeStyle = 'black';

		initGrid();
		startAnimating(30);

	}
	init();

	function initGrid(){

		var xPos, yPos;

			for(var x = 0; x < xCount; x++){
				for(var y = 0; y < yCount; y++){
				xPos = gridStepX *x;
				yPos = gridStepY *y;

				var node = new Node(xPos, yPos);
					node.velocity.x = 0; //??
					node.velocity.y = 0; //??
					node.damping = nodeDamping;
				var rand = Math.floor(Math.random()*3);
					if(rand === 0) node.type = 'rod';
					else if(rand === 1) node.type = 'dash';
					else if(rand === 2) node.type = 'dot';

				nodes.push(node);
			}
		}
	}

	function draw(){

		canvasCtx.clearRect(0,0, canvWidth, canvHeight);
		canvasCtx.fillStyle = bgColor;
		canvasCtx.fillRect(0,0, canvWidth, canvHeight);

		if(smoothModeInput.checked){
			attractor.mode = 'smooth';
		}else if(twistModeInput.checked){
			attractor.mode = 'twirl';
		}else{
			attractor.mode = 'basic';
		}

		var dataArray = new Uint8Array(fftSampleSize);
		fft.getByteTimeDomainData(dataArray);

		var da = dataArray[0];

		attractor.strength = Math.random()* (da * (attractStrengthInput.value/100));
			if(Math.floor(Math.random()*2) === 1) attractor.strength *= -1;
		attractor.radius = Math.random()* (da*attractRadiusInput.value);

		attractor.ramp = Math.random()*attractRampInput.value;

		// nodeDamping = Math.random()*0.8;
		// 	if(Math.floor(Math.random()*2) === 1) nodeDamping *= -1;

		nodeDamping = nodeDampingInput.value/100; //non-random


		for (var i = 0; i < nodes.length; i++) {
			nodes[i].setDamping(nodeDamping);
			attractor.attract(nodes[i]);
			nodes[i].update();
		}

		var i = 0;
		for(var y = 0; y < yCount; y++){
			canvasCtx.beginPath()
			for(var x = 0; x < xCount; x++){
				var theta = Math.atan2(canvHeight/2 - nodes[i].y, canvWidth/2 -nodes[i].x)
				if(nodes[i].type === 'rod'){
					rodPart.draw(nodes[i].x, nodes[i].y, theta);
				}else if(nodes[i].type === 'dash'){
					dashPart.draw(nodes[i].x, nodes[i].y, theta);
				}else if(nodes[i].type === 'dot'){
					dotPart.draw(nodes[i].x, nodes[i].y, theta);
				}

				// canvasCtx.moveTo(nodes[i].x, nodes[i].y);

				// var theta = Math.atan2(canvHeight/2 - nodes[i].y, canvWidth/2 -nodes[i].x); //point towards centre
				// var theta = Math.atan2(nodes[i+1].y - nodes[i].y, nodes[i+1].x -nodes[i].x); //point towards neighbour
				// canvasCtx.lineTo((Math.cos(theta)*5) + nodes[i].x, (Math.sin(theta)*5) +nodes[i].y);

				if(i+2 < nodes.length-1) i++;
			}
			canvasCtx.closePath();
			canvasCtx.stroke();
		}
	}

	var stop = false;
	var frameCount = 0;
	var fps, fpsInterval, startTime, now, then, elapsed;

	function startAnimating(fps){
		fpsInterval = 1000/fps;
		then = Date.now();
		startTime = then;
		animate();
	}

	function animate(){

		if(stop){
			return;
		}
		drawVisual = requestAnimationFrame(animate);

		now = Date.now();
		elapsed = now - then;

		if(elapsed > fpsInterval){
			then = now - (elapsed % fpsInterval);

			draw();
		}
	}
}

function nodeAttraction(dataArray, bufferLength){

	var rodPart = new RodParticle();
	var dashPart = new DashParticle();
	var dotPart = new DotParticle();


	var Attractor = (function(x, y){

		this.x = x;
		this.y = y;
		this.radius = 200; //radius of impact
		this.strength = 1; //+ for attraction, - for repulsion
		this.ramp = 0.5; // form of function

		this.attract = function(node){
			var dx = this.x - node.x;
			var dy = this.y - node.y;
			var d = Math.sqrt(
					Math.pow(dx, 2) + Math.pow(dy, 2)
				);
			if(d > 0 && d < this.radius){
				//calc force
				var s = d/this.radius;
				var f = (1 / Math.pow(s, 0.5*this.ramp) -1);

				//apply force
				node.velocity.x += dx * f;
				node.velocity.y += dy * f;
			}
		};
	});

	var Node = (function(x, y){

		this.type = null;
		this.minX = 5;
		this.minY = 5;
		this.maxX = canvWidth-5;
		this.maxY = canvHeight-5;
		this.damping = 0.1;
		this.x = x;
		this.y = y;
		this.velocity = {
			x: null,
			y: null
		};

		this.update = function(){

			this.x += this.velocity.x;
			this.y += this.velocity.y;

			if(this.x < this.minX){
				this.x = this.minX - (this.x - this.minX);
				this.velocity.x *= -1;
			}

			if(this.x > this.maxX){
				this.x = this.maxX - (this.x - this.maxX);
				this.velocity.x *= -1;
			}

			if(this.y < this.minY){
				this.y = this.minY - (this.y - this.minY);
				this.velocity.y *= -1;
			}

			if(this.y > this.maxY){
				this.y = this.maxY - (this.y - this.maxY);
				this.velocity.y *= -1;
			}

			this.velocity.x *= (1-this.damping);
			this.velocity.y *= (1-this.damping);
		};

		this.setBoundary = function(minX, minY, maxX, maxY){
			this.minX = minX;
			this.minY = minY;
			this.maxX = maxX;
			this.maxY = maxY;
		};

		this.setDamping = function(newDamping){
			this.damping = newDamping;
		};
	});

	//Runtime UI stuff
	var visSettings	= document.getElementById('vis-settings');
		visSettings.style.display = 'block';

	var nodeDampingInput = document.createElement('input');
		nodeDampingInput.type = 'range';
		nodeDampingInput.id = 'nodeDampingInput';
		nodeDampingInput.className = 'vis-setting';
		nodeDampingInput.min = 0;
		nodeDampingInput.max = 100;
		nodeDampingInput.value = 8; //need to be /100 for 0.8
		var nodeDampingLabel = document.createElement('label');
			nodeDampingLabel.htmlFor = 'nodeDampingInput';
			nodeDampingLabel.innerHTML = 'Node Damping';
			nodeDampingLabel.className = 'vis-setting';

	var showAttractNodeDiv = document.createElement('div');
		showAttractNodeDiv.className = 'vis-setting';
		var showAttractNode = document.createElement('input');
			showAttractNode.id = 'showAttractNode';
			showAttractNode.type = 'checkbox';
			showAttractNode.className = 'vis-setting switch-input';
			showAttractNode.checked = false;
		var showAttractNodePaddel = document.createElement('label');
			showAttractNodePaddel.className = 'vis-setting switch-paddle';
			showAttractNodePaddel.htmlFor = 'showAttractNode';
		var showAttractNodeLabel = document.createElement('label');
			showAttractNodeLabel.htmlFor = 'showAttractNode';
			showAttractNodeLabel.innerHTML = 'Show Attractor';
			showAttractNodeLabel.className = 'vis-setting';

	var attractRadiusInput = document.createElement('input');
		attractRadiusInput.type = 'range';
		attractRadiusInput.id = 'attractRadiusInput';
		attractRadiusInput.className = 'vis-setting';
		attractRadiusInput.min = 0;
		attractRadiusInput.max = 500;
		attractRadiusInput.value = 420;
		var attractRadiusLabel = document.createElement('label');
			attractRadiusLabel.htmlFor = 'attractRadiusInput';
			attractRadiusLabel.innerHTML = 'Attraction Radius';
			attractRadiusLabel.className = 'vis-setting';

		showAttractNodeDiv.appendChild(showAttractNodeLabel);
		showAttractNodeDiv.appendChild(showAttractNode)
		showAttractNodeDiv.appendChild(showAttractNodePaddel);

	var attractStrengthInput = document.createElement('input');
		attractStrengthInput.type = 'range';
		attractStrengthInput.id = 'attractStrengthInput';
		attractStrengthInput.className = 'vis-setting';
		attractStrengthInput.min = -50;
		attractStrengthInput.max = 50;
		attractStrengthInput.value = -42;
		var attractStrengthLabel = document.createElement('label');
			attractStrengthLabel.htmlFor = 'attractStrengthInput';
			attractStrengthLabel.innerHTML = 'Attraction Strength';
			attractStrengthLabel.className = 'vis-setting';

	var attractRampInput = document.createElement('input');
		attractRampInput.type = 'range';
		attractRampInput.id = 'attractRampInput';
		attractRampInput.className = 'vis-setting';
		attractRampInput.min = 0;
		attractRampInput.max = 1000;
		attractRampInput.value = 640; //need to be /100 for 0.2
		var attractRampLabel = document.createElement('label');
			attractRampLabel.htmlFor = 'attractRampInput';
			attractRampLabel.innerHTML = 'Attraction Ramp';
			attractRampLabel.className = 'vis-setting';

	var attractMaxVelocityInput = document.createElement('input');
		attractMaxVelocityInput.type = 'range';
		attractMaxVelocityInput.id = 'attractRadiusInput';
		attractMaxVelocityInput.className = 'vis-setting';
		attractMaxVelocityInput.min = 0;
		attractMaxVelocityInput.max = 20;
		attractMaxVelocityInput.value = 15;
		var attractMaxVelocityLabel = document.createElement('label');
			attractMaxVelocityLabel.htmlFor = 'attractRadiusInput';
			attractMaxVelocityLabel.innerHTML = 'Attract Node Velocity';
			attractMaxVelocityLabel.className = 'vis-setting';

	visSettings.appendChild(showAttractNodeDiv);
	visSettings.appendChild(attractRadiusLabel);
	visSettings.appendChild(attractRadiusInput);
	visSettings.appendChild(attractStrengthLabel);
	visSettings.appendChild(attractStrengthInput);
	visSettings.appendChild(attractRampLabel);
	visSettings.appendChild(attractRampInput);
	visSettings.appendChild(attractMaxVelocityLabel);
	visSettings.appendChild(attractMaxVelocityInput);
	visSettings.appendChild(nodeDampingLabel);
	visSettings.appendChild(nodeDampingInput);


	var xCount = canvWidth/75;
	var yCount = canvHeight/75;
	var nodeCount = xCount * yCount;
	var nodes;
	var node_Damping = nodeDampingInput.value/100;

	var attractor;
	var attractor_MaxRamp, attractor_Radius, attractor_Strength;

	var attractNode;
	var attractNode_MaxVelocity;


	$(window ).resize(function() {
  		init();
	});

	function init(){

		xCount = canvWidth/75;
		yCount = canvHeight/75;

		nodes = [];
		var gridSizeX = canvWidth/xCount;
		var gridSizeY = canvHeight/yCount;

		for(var y = 0; y < yCount; y++){
			for(var x = 0; x < xCount; x++){
				var xPos = x*gridSizeX;
				var yPos = y*gridSizeY;
				var node = new Node(xPos, yPos);
					node.setBoundary(0,0, canvWidth, canvHeight);
					node.setDamping(node_Damping);
				var rand = Math.floor(Math.random()*3);
					if(rand === 0) node.type = 'rod';
					else if(rand === 1) node.type = 'dash';
					else if(rand === 2) node.type = 'dot';
				nodes.push(node);
			}
		}

		attractor = new Attractor(canvWidth/2, canvHeight/2);
			attractor.radius = attractRadiusInput.value;
			attractor.strength = attractStrengthInput.value;
			attractor.ramp = attractRampInput.value/100;

		attractNode = new Node(canvWidth/2, canvHeight/2);
			attractNode.setBoundary(0,0, canvWidth, canvHeight);
			attractNode.setDamping(0);

			attractNode.velocity.x = attractMaxVelocityInput.value/2;
			attractNode.velocity.y = attractMaxVelocityInput.value/2;

		startAnimating(10);
	}
	init();


	function draw(){

		var dataArray = new Uint8Array(fftSampleSize);
		fft.getByteTimeDomainData(dataArray);

		// analyser.getByteFrequencyData(dataArray);
		var da = dataArray[0];

		canvasCtx.clearRect(0,0, canvWidth,canvHeight);
		canvasCtx.fillStyle = bgColor;
		canvasCtx.fillRect(0,0, canvWidth,canvHeight);

		attractor_Radius = attractRadiusInput.value;
		attractor_Strength = attractStrengthInput.value;
		attractNode_MaxVelocity = attractMaxVelocityInput.value;
		attractor_MaxRamp = da/attractRampInput.value;

		attractor.strength = attractor_Strength;
		attractor.radius = attractor_Radius;

		//velocity cap
		if(attractNode.velocity.x > attractNode_MaxVelocity) attractNode.velocity.x = attractNode_MaxVelocity;
		if(attractNode.velocity.x < attractNode_MaxVelocity *-1) attractNode.velocity.x = attractNode_MaxVelocity*-1;
		if(attractNode.velocity.y > attractNode_MaxVelocity) attractNode.velocity.y = attractNode_MaxVelocity;
		if(attractNode.velocity.y < attractNode_MaxVelocity *-1) attractNode.velocity.y = attractNode_MaxVelocity*-1;

		attractNode.velocity.x -= Math.random()*attractNode_MaxVelocity;
		attractNode.velocity.y -= Math.random()*attractNode_MaxVelocity;
		attractNode.velocity.x += Math.random()*attractNode_MaxVelocity;
		attractNode.velocity.y += Math.random()*attractNode_MaxVelocity;

		attractNode.update();
		if(showAttractNode.checked){
			canvasCtx.beginPath();
			canvasCtx.arc(attractNode.x, attractNode.y, 5, 0, Math.PI*2);
			canvasCtx.closePath();
			canvasCtx.fillStyle = 'black';
			canvasCtx.fill();
			canvasCtx.beginPath();
			canvasCtx.arc(attractNode.x, attractNode.y, attractor.radius, 0, Math.PI*2);
			canvasCtx.closePath();
			canvasCtx.strokeStyle = 'black';
			canvasCtx.stroke();
		}

		attractor.x = attractNode.x;
		attractor.y = attractNode.y;


		attractor.ramp = Math.random()*attractor_MaxRamp;
		if(Math.floor(Math.random()*2) === 1) attractor.ramp*=-1;



		for(var i = 0; i < nodes.length; i++){

			node_Damping = nodeDampingInput.value/100;
			nodes[i].setDamping(node_Damping);
			attractor.attract(nodes[i]);
			nodes[i].update();

			// canvasCtx.beginPath();
			// canvasCtx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI*2);
			// canvasCtx.closePath();

			// var rand = Math.floor(Math.random()*2);
			// if(i%5 === 0){
			// 	canvasCtx.fillStyle = 'hsl(282, 100%, 50%)';
			// }else if(i%3 === 0){
			// 	canvasCtx.fillStyle = 'hsl(332, 100%, 50%)';
			// }else{
			// 	canvasCtx.fillStyle = 'hsl(182, 100%, 50%)';
			// }

			// canvasCtx.fill();

			var theta = Math.atan2(attractor.y - nodes[i].y, attractor.x -nodes[i].x)

			if(nodes[i].type === 'rod'){
				rodPart.draw(nodes[i].x, nodes[i].y, theta);
			}else if(nodes[i].type === 'dash'){
				dashPart.draw(nodes[i].x, nodes[i].y, theta);
			}else if(nodes[i].type === 'dot'){
				dotPart.draw(nodes[i].x, nodes[i].y, theta);
			}
		}
	}


	var stop = false;
	var frameCount = 0;
	var fps, fpsInterval, startTime, now, then, elapsed;

	function startAnimating(fps){
		fpsInterval = 1000/fps;
		then = Date.now();
		startTime = then;
		animate();
	}

	function animate(){
		if(stop){
			return;
		}
		drawVisual = requestAnimationFrame(animate);

		now = Date.now();
		elapsed = now - then;

		if(elapsed > fpsInterval){
			then = now - (elapsed % fpsInterval);

			draw();
		}
	}
}

function lissajousFigure(dataArray, bufferLength){

		//Runtime UI stuff
		var visSettings	= document.getElementById('vis-settings');
			visSettings.style.display = 'block';

		var freqXInput = document.createElement('input');
			freqXInput.type = 'range';
			freqXInput.id = 'freqXInput';
			freqXInput.className = 'vis-setting';
			freqXInput.min = 1;
			freqXInput.max = 70;
			freqXInput.value = 40;
			var freqXLabel = document.createElement('label');
				freqXLabel.htmlFor = 'freqXInput';
				freqXLabel.className = 'vis-setting';
				freqXLabel.innerHTML = 'Freq X';

		var freqYInput = document.createElement('input');
			freqYInput.type = 'range';
			freqYInput.id = 'freqYInput';
			freqYInput.className = 'vis-setting';
			freqYInput.min = 1;
			freqYInput.max = 70;
			freqYInput.value = 40;
			var freqYLabel = document.createElement('label');
				freqYLabel.htmlFor = 'freqYInput';
				freqYLabel.className = 'vis-setting';
				freqYLabel.innerHTML = 'Freq Y';

		var phiInput = document.createElement('input');
			phiInput.type = 'range';
			phiInput.id = 'phiInput';
			phiInput.className = 'vis-setting';
			phiInput.min = 1;
			phiInput.max = 360;
			phiInput.value = 95;
			var phiLabel = document.createElement('label');
				phiLabel.htmlFor = 'phiInput';
				phiLabel.className = 'vis-setting';
				phiLabel.innerHTML = 'Phi';

		var pointCountInput = document.createElement('input');
			pointCountInput.type = 'range';
			pointCountInput.id = 'pointCountInput';
			pointCountInput.className = 'vis-setting';
			pointCountInput.min = 10;
			pointCountInput.max = 300;
			pointCountInput.value = 50;
			pointCountInput.addEventListener("change", function(){
					init();
				});
			var pointCountLabel = document.createElement('label');
				pointCountLabel.htmlFor = 'pointCountInput';
				pointCountLabel.className = 'vis-setting';
				pointCountLabel.innerHTML = 'Point Count';

		var modFreqXInput = document.createElement('input');
			modFreqXInput.type = 'range';
			modFreqXInput.id = 'modFreqXInput';
			modFreqXInput.className = 'vis-setting';
			modFreqXInput.min = 1;
			modFreqXInput.max = 70;
			modFreqXInput.value = 40;
			var modFreqXLabel = document.createElement('label');
				modFreqXLabel.htmlFor = 'modFreqXInput';
				modFreqXLabel.className = 'vis-setting';
				modFreqXLabel.innerHTML = 'Mod Freq X';

		var modFreqYInput = document.createElement('input');
			modFreqYInput.type = 'range';
			modFreqYInput.id = 'modFreqYInput';
			modFreqYInput.className = 'vis-setting';
			modFreqYInput.min = 1;
			modFreqYInput.max = 70;
			modFreqYInput.value = 40;
			var modFreqYLabel = document.createElement('label');
				modFreqYLabel.htmlFor = 'modFreqYInput';
				modFreqYLabel.className = 'vis-setting';
				modFreqYLabel.innerHTML = 'Mod Freq Y';

		var modulatedDiv = document.createElement('div');


			modulatedDiv.className = 'vis-setting';
			var modulatedCheck = document.createElement('input');
				modulatedCheck.id = 'modulatedCheck';
				modulatedCheck.type = 'checkbox';
				modulatedCheck.className = 'vis-setting switch-input';
				modulatedCheck.checked = false;
				modulatedCheck.addEventListener("change", function(){
					init();
				});
			var modulatedPaddel = document.createElement('label');
				modulatedPaddel.className = 'vis-setting switch-paddle';
				modulatedPaddel.htmlFor = 'modulatedCheck';
			var modulatedLabel = document.createElement('label');
				modulatedLabel.htmlFor = 'modulatedCheck';
				modulatedLabel.innerHTML = 'Modulated';
				modulatedLabel.className = 'vis-setting';

			modulatedDiv.appendChild(modulatedLabel);
			modulatedDiv.appendChild(modulatedCheck);
			modulatedDiv.appendChild(modulatedPaddel);

		var radiusInput = document.createElement('input');
			radiusInput.type = 'range';
			radiusInput.id = 'radiusInput';
			radiusInput.className = 'vis-setting';
			radiusInput.min = 1;
			radiusInput.max = canvWidth/2 > canvHeight/2 ? canvHeight/2 : canvWidth/2;
			radiusInput.value = radiusInput.max/2;
			var radiusLabel = document.createElement('label');
				radiusLabel.htmlFor = 'radiusInput';
				radiusLabel.className = 'vis-setting';
				radiusLabel.innerHTML = 'Radius';

		visSettings.appendChild(modulatedDiv);
		visSettings.appendChild(pointCountLabel);
		visSettings.appendChild(pointCountInput);
		visSettings.appendChild(phiLabel);
		visSettings.appendChild(phiInput);
		visSettings.appendChild(freqXLabel);
		visSettings.appendChild(freqXInput);
		visSettings.appendChild(freqYLabel);
		visSettings.appendChild(freqYInput);

		visSettings.appendChild(modFreqXLabel);
		visSettings.appendChild(modFreqXInput);
		visSettings.appendChild(modFreqYLabel);
		visSettings.appendChild(modFreqYInput);

		visSettings.appendChild(radiusLabel);
		visSettings.appendChild(radiusInput);

		var pointCount;
		var freqX, freqY;
		var phi, angle;
		var x, y;
		var margin = 50;

		var modFreqX = 2;
		var modFreqY = 4;
		var modPhi = 0;

		var w, maxDist;
		var oldX, oldY;

		var factorX = canvWidth/4;
		var factorY = canvHeight/4;

		var modulated;

		var particleArray;

		var rodPart = new RodParticle();
		var dashPart = new DashParticle();
		var dotPart = new DotParticle();

		function init(){
			canvasCtx.clearRect(0,0, canvWidth, canvHeight);
			canvasCtx.fillStyle = bgColor;
			canvasCtx.fillRect(0,0, canvWidth, canvHeight);

			if(modulatedCheck.checked){
				modulated = true;
			}else{
				modulated = false;
			}
			canvasCtx.strokeStyle = 'black';
			pointCount = parseInt(pointCountInput.value);
			freqX = parseInt(freqXInput.value);
			freqY = parseInt(freqYInput.value);
			phi = parseInt(phiInput.value);

			particleArray = [];
			for(var i = 0; i < pointCount; i++){
				var type;
				var rand = Math.floor(Math.random()*3);
					if(rand === 0) type = 'rod';
					else if(rand === 1) type = 'dash';
					else if(rand === 2) type = 'dot';

				var particle = {
					type: type,
					x: null,
					y: null
				}
				particleArray.push(particle);
			}

			startAnimating(15);
		}
		init();


		function draw(){

			canvasCtx.clearRect(0,0, canvWidth, canvHeight);
			canvasCtx.fillStyle = bgColor;
			canvasCtx.fillRect(0,0, canvWidth, canvHeight);

			var dataArray = new Uint8Array(fftSampleSize);
			fft.getByteTimeDomainData(dataArray);
			var da = dataArray[0];


			var logda = da;//(Math.log(da) / Math.log(2));
			if(isFinite(logda) && logda !== 0){
				freqX = logda * parseInt(freqXInput.value);
				// freqY = logda * parseInt(freqYInput.value);
				modFreqX = logda * parseInt(modFreqXInput.value);
				modFreqY = logda * parseInt(modFreqYInput.value);
				phi = parseInt(phiInput.value) - logda;
				factorX = parseInt(radiusInput.value);
				factorY = parseInt(radiusInput.value);
			}
			// else{
			// 	freqX = parseInt(freqXInput.value);
			// 	// freqY = logda * parseInt(freqYInput.value);
			// 	modFreqX = parseInt(modFreqXInput.value);
			// 	modFreqY = parseInt(modFreqYInput.value);
			// 	phi = parseInt(phiInput.value);
			// 	// factorX = parseInt(radiusInput.value);
			// 	// factorY = parseInt(radiusInput.value);
			// }


			for(var i = 0; i < particleArray.length; i++){
				angle = map_range(i, 0,pointCount, 0,Math.PI*2);

				if(modulated){
					x = Math.sin(angle*freqX + (Math.PI/180)*phi * Math.cos(angle *modFreqX));
					y = Math.sin(angle*freqY) * Math.cos(angle * modFreqY);
				}else{
					x = Math.sin(angle*freqX + (Math.PI/180)*phi); //lissajous
					y = Math.sin(angle*freqY); //lissajous
				}

				particleArray[i].x =  x * factorX + canvWidth/2;
				particleArray[i].y = y * factorY + canvHeight/2;

				var pointerPart = particleArray[i-1];

				if(i !== 0){ //HACK prevents the 'stray' from occur due to index length issue
					var theta = Math.atan2(pointerPart.y - particleArray[i].y, pointerPart.x -particleArray[i].x);
					if(particleArray[i].type === 'rod')
						rodPart.draw(particleArray[i].x, particleArray[i].y, theta);
					else if(particleArray[i].type === 'dash')
						dashPart.draw(particleArray[i].x, particleArray[i].y, theta);
					else if(particleArray[i].type === 'dot')
						dotPart.draw(particleArray[i].x, particleArray[i].y, theta);
				}
			}
		}

		function map_range(value, low1, high1, low2, high2) {
			return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
		}

		var stop = false;
		var frameCount = 0;
		var fps, fpsInterval, startTime, now, then, elapsed;

		function startAnimating(fps){
			fpsInterval = 1000/fps;
			then = Date.now();
			startTime = then;
			animate();
		}

		function animate(){
			if(stop){
				return;
			}
			drawVisual = requestAnimationFrame(animate);

			now = Date.now();
			elapsed = now - then;

			if(elapsed > fpsInterval){
				then = now - (elapsed % fpsInterval);

				draw();
			}
		}
}
