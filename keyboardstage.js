var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

// Set the scene size.
const WIDTH = w-30;
const HEIGHT = (w-30)/3;

// Set some camera attributes.
const VIEW_ANGLE = 40;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 300;
const FAR = 1000;

// Get the DOM element to attach to
const container =
    document.querySelector('#container');
	
// Create a WebGL renderer, camera
// and a scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
const camera =
    new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR
    );

const scene = new THREE.Scene();

// Add the camera to the scene.
scene.add(camera);

// Start the renderer.
renderer.setSize(WIDTH, HEIGHT);
renderer.shadowMapEnabled = true;

// Attach the renderer-supplied
// DOM element.
container.appendChild(renderer.domElement);

/// Camera setup

camera.position.set(0,160,700);
//camera.up = new THREE.Vector3(0,1,0);
camera.lookAt(new THREE.Vector3(0,220,0));

/***
* STAGE SCENARIO
**/

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 400;
const STAGE_DEPTH = 400;

var wallMaterial = new THREE.MeshPhongMaterial({color:0x666666});

var ground = new THREE.Mesh(new THREE.PlaneGeometry(STAGE_WIDTH, STAGE_DEPTH, 1, 1),wallMaterial);
ground.rotateX(-Math.PI/2);
ground.receiveShadow = true;
scene.add(ground);

var backwall = new THREE.Mesh(new THREE.PlaneGeometry(STAGE_WIDTH, STAGE_HEIGHT, 1, 1),wallMaterial);
backwall.position.set(0,STAGE_HEIGHT/2,-STAGE_DEPTH/2);
backwall.receiveShadow = true;
scene.add(backwall);

/***
*	MOVING SPOT
*/

var MovingSpotLight = function(radius, height, beam, shadow, color, intensity, distance, angle) {
	THREE.Object3D.call( this )
	
	this.maxintensity = intensity;
	this.lastStrobo = 0;
	
	this.light = new THREEx.VolumetricSpotLight( beam, shadow, color, intensity, distance, angle );
	this.add(this.light);
	this.add(this.light.target);
	
	// MESH
	var geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
	this.mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0x333333}));
	this.add(this.mesh);
	
	// DIMMER
	this.dimmer = 1;
	this.strobo = 0;
	
	// COLOR
	this.color = new THREE.Color(1,1,1);
	
	// PAN/TILT
	this.pan = 0;
	this.tilt = 0;
	
	this.mirrorPan = false;
	this.mirrorTilt = false;
	
	// ZOOM
	this.zoom = 0.1;
}

MovingSpotLight.prototype = Object.create( THREE.Object3D.prototype );
MovingSpotLight.prototype.constructor = MovingSpotLight;

MovingSpotLight.prototype.update = function() {
	
	// DIMMER/STROBO
	if (this.dimmer < 0) this.dimmer = 0;
	else if (this.dimmer > 1) this.dimmer = 1;
	if (this.strobo < 0) this.strobo = 0;
	else if (this.strobo > 1) this.strobo = 1;
	
	// no strobo (solid)
	if (this.strobo == 0) {
		this.light.intensity = this.dimmer * this.maxintensity;
	}
	// strobo (flicker)
	else {
		var d = new Date();
		var t = d.getTime();
		if (this.stroboState && t > this.lastStrobo + 10) {
			this.stroboState = false;
			this.lastStrobo = t;
		}
		else if (!this.stroboState && t > this.lastStrobo + 510-500*this.strobo){
			this.stroboState = true;
			this.lastStrobo = t;
		}
		
		if (this.stroboState) this.light.intensity = this.dimmer * this.maxintensity;
		else this.light.intensity = 0;
	}
	
	// PAN/TILT
	if (this.pan < -1) this.pan = -1;
	else if (this.pan > 1) this.pan = 1;
	if (this.tilt < -1) this.tilt = -1;
	else if (this.tilt > 1) this.tilt = 1;
	
	this.light.target.position.set(0,-10,0);
	this.light.target.position.applyEuler(new THREE.Euler(-Math.PI*this.tilt/2*(this.mirrorTilt?-1:1),Math.PI*this.pan*(this.mirrorPan?-1:1),0,'YXZ'));

	this.mesh.rotation.copy(this.light.rotation);
	this.light.update();
	
	// COLOR
	this.light.color.copy(this.color);
	
	// ZOOM
	if (this.zoom > 1) this.zoom = 1;
	else if (this.zoom < 0) this.zoom = 0;
	this.light.angle = Math.PI/40 + Math.PI*this.zoom/6;
}

/***
*	STAGE
*/

var spots = [];

for (var i = 0; i < 19; i++) {
	spots[i] = new MovingSpotLight( 10, 20, 0.5, false, 0xffffff, 5, 700, Math.PI/30);
	
	// Left
	if (i < 3) {
		spots[i].position.set( -STAGE_WIDTH/2, 100+75*i, -STAGE_DEPTH/2 + 20 );
		spots[i].rotation.set(-Math.PI/2,0,0);
		spots[i].dimmer = 1;
	}
	// Line 1
	else if (i < 8) {
		spots[i].position.set( (STAGE_WIDTH/10)-STAGE_WIDTH/2+(i-3)*((STAGE_WIDTH-2*STAGE_WIDTH/10)/4), STAGE_HEIGHT - STAGE_HEIGHT/6, -STAGE_DEPTH/2 + 20 );
		spots[i].dimmer = 1;
	}
	// Line 2
	else if (i < 12) {
		spots[i].position.set( (STAGE_WIDTH/6)-STAGE_WIDTH/2+(i-8)*((STAGE_WIDTH-2*STAGE_WIDTH/6)/3), STAGE_HEIGHT - STAGE_HEIGHT/8, -STAGE_DEPTH/2 + 140 );
		spots[i].dimmer = 1;
	}
	// Line 3 L
	else if (i < 16) {
		if (i < 14) spots[i].position.set( (STAGE_WIDTH/8)-STAGE_WIDTH/2+(i-12)*((STAGE_WIDTH-2*STAGE_WIDTH/8)/4), STAGE_HEIGHT, -STAGE_DEPTH/2 + 260 );
		else spots[i].position.set( (STAGE_WIDTH/8)-STAGE_WIDTH/2+(i-11)*((STAGE_WIDTH-2*STAGE_WIDTH/8)/4), STAGE_HEIGHT, -STAGE_DEPTH/2 + 260 );
		spots[i].dimmer = 1;
	}
	// Right
	else {
		spots[i].position.set( STAGE_WIDTH/2, 100+75*(i-16), -STAGE_DEPTH/2 + 20 );
		spots[i].rotation.set(-Math.PI/2,0,0);
		spots[i].mirrorPan = true;
		spots[i].dimmer = 1;
	}
	
	
	scene.add(spots[i]);
}


/**
*	ENGINE
*/

// TIME
BPM = function() {
	this.bpm = 60;
	this.start = Date.now();
	
	this.T = 0;
	this.Diff = 0;
	
	this.lastMilli = 0;
	
	this.Update = function() {
		var milli = Date.now() - this.start;
		var t = this.T + (milli-this.lastMilli)/(60000/this.bpm);
		this.lastMilli = milli;
		this.diff = t - this.T;
		this.T = t;
	};
};

Time = new BPM();

// PRESET
Preset = function(presets) {
	this.preset = 0;
	this.step = 0;
	this.fade = 1;
	
	this.presets = presets;
	
	this.Get = function(index) {
		var preset = this.presets[this.preset];
		if (preset) return preset[(index+this.step)%preset.length];
		return 0;
	}
		
	this.Set = function(preset, resetStep = false) {
		if (resetStep && this.preset != preset) this.step = 0;
		else this.step++;
		
		this.preset = preset;
		this.fade = 0;
	}
	
	this.Update = function() { 
		this.fade += Time.diff;
		if (this.fade > 1) this.fade = 1;
	}
}

// DIMMER
var DimmerPreset = new Preset([
/*A*/	[1],
/*S*/	[1,0],
/*D*/	[1,0,0],
/*F*/	[1,0,0,0],
/*G*/	[1,0,0,0,0],
/*H*/	[1,0,0,0,0,0]
]);

function UpdateDimmer() {
	// Preset
	DimmerPreset.Update();
	for (var s = 0; s < 19; s++) {
		spots[s].dimmer += (DimmerPreset.Get(s) - spots[s].dimmer)*DimmerPreset.fade;
	}
}

// COLOR
var ColorPreset = new Preset([
/*1*/	[0xffffff],
/*2*/	[0xff0000,0xff6600,0xff4400],
/*3*/	[0x00ff77,0x00ffaa,0x00ff44],
/*4*/	[0x0000ff,0x4227ff,0x6042ff],
/*5*/	[0xff00ff,0xffff00,0xff00ff,0xffff00,0xff00ff,0xffff00,0xff00ff,0xffff00,0xffff00,0xff00ff,0xff00ff,0xffff00,0xff00ff,0xffff00,0xffff00,0xff00ff,0xff00ff,0xffff00,0xff00ff],
/*6*/	[0xff0000,0x0000ff,0xff0000,0x0000ff,0xff0000,0x0000ff,0xff0000,0x0000ff,0x0000ff,0xff0000,0xff0000,0x0000ff,0xff0000,0x0000ff,0x0000ff,0xff0000,0xff0000,0x0000ff,0xff0000]
]);

function UpdateColor() {
	// Preset
	ColorPreset.Update();
	for (var s = 0; s < 19; s++) {
		var color = new THREE.Color(ColorPreset.Get(s));
		spots[s].color.r += (color.r - spots[s].color.r)*ColorPreset.fade;
		spots[s].color.g += (color.g - spots[s].color.g)*ColorPreset.fade;
		spots[s].color.b += (color.b - spots[s].color.b)*ColorPreset.fade;
	}
}

// PAN TILT
var PTPreset = new Preset([
/*W*/	[[0,0]],
/*Q*/	[[-0.2,-0.4],[-0.25,-0.7],[-0.3,-0.9],[-0.3,0.4],[-0.15,0.2],[0,0.1],[0.15,0.2],[0.3,0.4],[0.4,0.3],[0.25,0.4],[-0.25,0.4],[-0.4,0.3],[-0.3,0.2],[-0.4,0.1],[0.4,0.1],[0.3,0.2],[-0.2,-0.4],[-0.25,-0.7],[-0.3,-0.9]],
/*E*/	[[0,0]],
/*R*/	[[0,0]],
/*T*/	[[0,0]]
]);

function UpdatePT() {
	// Preset
	PTPreset.Update();
	for (var s = 0; s < 19; s++) {
		spots[s].pan += (PTPreset.Get(s)[0] - spots[s].pan)*PTPreset.fade;
		spots[s].tilt += (PTPreset.Get(s)[1] - spots[s].tilt)*PTPreset.fade;
	}
}


/*
* Maintenance Light

var pointLight = new THREE.PointLight(0xffffff,0);
pointLight.position.set(0,400,0);
scene.add(pointLight);
*/

/**
*	KEYBOARD
*/

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
	// -/+ (speed)
	if (keyCode == 189) Time.bpm -= 5;
	else if (keyCode == 187) Time.bpm += 5;
	// A/S/D/F/G/H (dimmer presets)
	else if (keyCode == 65) DimmerPreset.Set(0);
	else if (keyCode == 83) DimmerPreset.Set(1);
	else if (keyCode == 68) DimmerPreset.Set(2);
	else if (keyCode == 70) DimmerPreset.Set(3);
	else if (keyCode == 71) DimmerPreset.Set(4);
	else if (keyCode == 72) DimmerPreset.Set(5);
	// 1~6 (color presets)
    else if (keyCode >= 49 && keyCode <= 54) ColorPreset.Set(keyCode-49);
	// 9/0 (zoom)
	else if (keyCode == 57) for(var i = 0; i < 19; i++) spots[i].zoom -= 0.004;
	else if (keyCode == 48) for(var i = 0; i < 19; i++) spots[i].zoom += 0.004;
	// Q/W/E/R/T (pantilt presets)
	else if (keyCode == 81) PTPreset.Set(0, true);
	else if (keyCode == 87) PTPreset.Set(1, true);
	else if (keyCode == 69) PTPreset.Set(2, true);
	else if (keyCode == 82) PTPreset.Set(3, true);
	else if (keyCode == 84) PTPreset.Set(4, true);
	
};

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
	// -/+ (speed)
	if (keyCode == 189) Time.bpm -= 5;
	else if (keyCode == 187) Time.bpm += 5;
	// A/S/D/F/G/H (dimmer presets)
	else if (keyCode == 65) DimmerPreset.Set(0);
	else if (keyCode == 83) DimmerPreset.Set(1);
	else if (keyCode == 68) DimmerPreset.Set(2);
	else if (keyCode == 70) DimmerPreset.Set(3);
	else if (keyCode == 71) DimmerPreset.Set(4);
	else if (keyCode == 72) DimmerPreset.Set(5);
	// 1~6 (color presets)
    else if (keyCode >= 49 && keyCode <= 54) ColorPreset.Set(keyCode-49);
	// 9/0 (zoom)
	else if (keyCode == 57) for(var i = 0; i < 19; i++) spots[i].zoom -= 0.004;
	else if (keyCode == 48) for(var i = 0; i < 19; i++) spots[i].zoom += 0.004;
	// Q/W/E/R/T (pantilt presets)
	else if (keyCode == 81) PTPreset.Set(0, true);
	else if (keyCode == 87) PTPreset.Set(1, true);
	else if (keyCode == 69) PTPreset.Set(2, true);
	else if (keyCode == 82) PTPreset.Set(3, true);
	else if (keyCode == 84) PTPreset.Set(4, true);
	
};

/**
*	LOOP
*/

function update() {
	
	//console.log(Time.Get());
	
	// Animate
	Time.Update();
	UpdateDimmer();
	UpdateColor();
	UpdatePT();
	
	// Update spots
	for (var i = 0; i < 19; i++) spots[i].update();
	
	// Render
	renderer.render(scene,camera);
	
	// Loop
	requestAnimationFrame(update);
}

update();