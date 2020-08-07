var light1, light2;
var models = {};
var houses = [];
var trees = [];
var fuels = [];
var obstacles = [];
var numHouses = 6;
var numTrees = 6;
var numFuels = 0;
var maxFuels;
var numObstacles = 0;
var maxObstacles;
var maxTime;
var lifes = 3;
var score = 0;
var game_over = false;
var speedZ;

function initAll(){
	//renderer
	renderer.setSize(width, height);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	container = document.getElementById('gamecontainer');
	container.appendChild(renderer.domElement);

	//camera
	camera.position.set(0,0,100);
	camera.lookAt(new THREE.Vector3(0,0,0));
	scene.add(camera);

	//lights
	light1 = new THREE.AmbientLight(0xe1e1d1, 1.4 , 1); //yellow
	light1.position.set(30, 10, 30);
	scene.add(light1);

	//clock (to load obstacles and fuels)
	clock = new THREE.Clock();
	clock.start();
}
 
// SKY
function setSky(){
	var skyTexture = textLoader.load("../textures/sky.jpg");
	var skyMaterial = new THREE.MeshBasicMaterial({map:skyTexture});
	var skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 300, 32),skyMaterial);
	skyMesh.position.set( 0 , 139, -250);
	scene.fog = new THREE.Fog(0xffffff, 500, 10000); 	//white
	scene.add(skyMesh)
}

// GROUND
function setGround(){
	//grass
	var grassTexture = textLoader.load('../textures/grass.jpg');
	grassTexture.wrapS = THREE.RepeatWrapping;
	grassTexture.wrapT = THREE.RepeatWrapping;
	grassTexture.repeat.set(25, 25);
	grassTexture.encoding = THREE.sRGBEncoding;

	var grassMaterial = new THREE.MeshLambertMaterial({map:grassTexture, side:THREE.DoubleSide,});
	var meshGrass = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000), grassMaterial);
	meshGrass.position.y = -200;
	meshGrass.rotation.x = -Math.PI/2;
	scene.add(meshGrass);

	//street
	var roadTexture = textLoader.load('../textures/dirt_road.jpg');
	roadTexture.wrapS = THREE.RepeatWrapping;
	roadTexture.wrapT = THREE.RepeatWrapping;
	roadTexture.repeat.set(1, 25);
	roadTexture.encoding = THREE.sRGBEncoding;
	
	var roadMaterial = new THREE.MeshLambertMaterial({map:roadTexture, side:THREE.DoubleSide, shading:THREE.FlatShading,});
	var meshRoad = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 20000), roadMaterial)
	meshRoad.position.y = -199;
	meshRoad.rotation.x = -Math.PI/2;
	scene.add(meshRoad);
}

// LOADER MODELS
function loadModels(){
	loadGLTF('house1', "../models/house1.gltf", housesLoaded);
	loadGLTF('tree', "../models/tree.gltf", treeLoaded);
	loadGLTF('house2', "../models/house2.gltf", housesLoaded);
	loadGLTF('house3', "../models/house3.gltf", housesLoaded);
	loadGLTF('transformer', "../models/transformer.gltf", transformerLoaded);
	loadGLTF('fuel', "../models/fuel.gltf", function(){});
	loadGLTF('obstacle', "../models/obstacle.gltf", function(){});
}

function loadGLTF(name, path, modelLoaded){
	loader.load(path, function(gltf){
		models[name] = gltf.scene;
		modelLoaded();
	},
	function(xhr){console.log(name + ' ' + (xhr.loaded / xhr.total * 100) + '% loaded');},
	function(error){console.log('An error happened'+error);}
	);
}

//houses cloned
function housesLoaded(){
	if(models['house1'] && models['house2'] && models['house3']){
		for(i=0; i<2; i++){
			houses.push(models['house1'].clone());
			houses.push(models['house2'].clone());
			houses.push(models['house3'].clone());
		}

		houses[0].position.set(65, 0, -170);
		houses[1].position.set(75, -1, -100);
		houses[2].position.set(75, -10, 0);

		houses[3].position.set(-65, 0, -140);
		houses[4].position.set(-75, -1, -70);
		houses[5].position.set(-75, -10, 30);

		for(i=0; i<numHouses; i++){
			houses[i].scale.set(2,2,2);
			if(i>2){
				houses[i].rotation.y = Math.PI;
			}
			scene.add(houses[i]);
		}
	}
}

//trees cloned
function treeLoaded(){
	for(i=0; i<numTrees; i++){
		trees.push(models['tree'].clone());
	}

	trees[0].position.set(50, -10, -190);
	trees[1].position.set(50, -10, -120);
	trees[2].position.set(50, -10, -50);

	trees[3].position.set(-50, -10, -160);
	trees[4].position.set(-50, -10, -90);
	trees[5].position.set(-50, -10, -20);

	for(i=0; i<numTrees; i++){ 
		trees[i].scale.set(2,2,2);
		if(i>2){
			trees[i].rotation.y = Math.PI;
		}
		scene.add(trees[i]);
	}
}

//bumblebee
function transformerLoaded(){
	models['transformer'].position.set(0, -50, 20);
	models['transformer'].scale.set(6,6,6);
	models['transformer'].rotation.y = Math.PI/2;
	scene.add(models['transformer']);
}

// EVENTS
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event){
	var keyCode = event.which;
	if (keyCode == 37){	//left
		if(models['transformer'].position.x != -37){
			models['transformer'].position.x -= 37;
			console.log('moved to left');
		}
	} else if (keyCode == 39){ //right
		if(models['transformer'].position.x != 37){
			models['transformer'].position.x += 37;
			console.log('moved to right');
 		}
	}
}

//variables for the animation of bumblebee
var right_arm_up = true;
var left_arm_up = false;
var right_leg_up = true;
var left_leg_up = false;
var toLeft = true;
var noTouch = false;
//animation of bumblebee
function renderTransformer(){
	if(!game_over){
		models['transformer'].traverse(function(child){
			if(child.name == "left_lower_heel" || child.name == "left_upper_heel" || child.name == "right_lower_heel" || child.name == "right_upper_heel"){
				child.rotation.y += 0.09;
			}
			else if(child.name == "left_front_heel" || child.name == "right_front_heel"){
				child.rotation.x += 0.09;
			}
			else if(child.name == "right_arm" ){
				if(child.rotation.z >= 0.4) right_arm_up = false;
				else if(child.rotation.z <= -0.4) right_arm_up = true;
				if(right_arm_up){
					child.rotation.z += 0.02;
				}else{
					child.rotation.z -= 0.02;
				}
			}else if(child.name == "left_arm" ){
				if(child.rotation.z >= 0.4) left_arm_up = false;
				else if(child.rotation.z <= -0.4) left_arm_up = true;
				if(left_arm_up){
					child.rotation.z += 0.02;
				}else{
					child.rotation.z -= 0.02;
				}
			}else if(child.name == "right_upper_leg"){
				if(child.rotation.z >= 0.5) right_leg_up = false;
				else if(child.rotation.z <= -0.5) right_leg_up = true;
				if(right_leg_up){
					child.rotation.z += 0.01;
				}else{
					child.rotation.z -= 0.01;
				}
			}else if(child.name == "right_lower_leg"){
				if(right_leg_up){
					child.rotation.z -= 0.01;
				}else{
					child.rotation.z += 0.01;
				}
			}else if(child.name == "left_upper_leg"){
				if(child.rotation.z >= 0.5) left_leg_up = false;
				else if(child.rotation.z <= -0.5) left_leg_up = true;
				if(left_leg_up){
					child.rotation.z += 0.01;
				}else{
					child.rotation.z -= 0.01;
				}
			}else if(child.name == "left_lower_leg"){
				if(left_leg_up){
					child.rotation.z -= 0.01;
				}else{
					child.rotation.z += 0.01;
				}
			}
		})
	}else{	//if game over, bumblebee moved to the center and rotate
		models['transformer'].position.x = 0;
		models['transformer'].position.y = -35;
		models['transformer'].rotation.y -= 0.1;
		models['transformer'].scale.set(10,10,10);
	}
}

//get the variable from index.html url
function setLevel() {
	var queryString = window.location.search;
	var urlParams = new URLSearchParams(queryString);
	var speed = urlParams.get('speed');
	console.log(speed);
	if(speed == 'easy'){
		speedZ = 1;
		maxFuels = 4;
		maxObstacles = 4;
		maxTime = 3;
	}else if(speed == 'medium'){
		speedZ = 1.5;
		maxFuels = 4;
		maxObstacles = 6;
		maxTime = 2;
	}else if(speed == 'hard'){
		speedZ = 2;
		maxFuels = 4;
		maxObstacles = 8;
		maxTime = 1;
	}
}

//render houses
function renderHouses(){
	for(i=0; i<numHouses; i++){
		if(houses[i].position.z > 50){
			houses[i].position.z = -210;
		}
		houses[i].position.z += speedZ;
	}
}

//render trees
function renderTrees(){
	for(i=0; i<numTrees; i++){
		if(trees[i].position.z > 50){
			trees[i].position.z = -210;
		}
		trees[i].position.z += speedZ;
	}
}

//random x position for fuels and obstacles
function randomPosX(){
	var randPos = Math.floor(Math.random() * 3);	//random number {0,1,2}: 0=left, 1=center, 2=right
	var posX = 0;
	if(randPos == 0){
		posX = -45;
	}else if(randPos == 1){
		posX = 0;
	}else{
		posX = 45;
	}
	return posX;
}

//load either an obstacle or a fuel randomly and position it randomly
function loadElements(){
	var rand = Math.floor(Math.random() * 2);	//random number {0,1}: 0=obstacle, 1=fuel 
	var posX = randomPosX();
	if(rand == 0 && numObstacles < maxObstacles){	
		obstacles.push(models['obstacle'].clone());
		obstacles[numObstacles].position.set(posX,-43,-650);
		obstacles[numObstacles].scale.set(15,15,15);
		obstacles[numObstacles].rotation.y = 80;
		scene.add(obstacles[numObstacles]);
		numObstacles+=1;
	}else if(rand == 1 && numFuels < maxFuels){
		fuels.push(models['fuel'].clone());
		fuels[numFuels].position.set(posX, -43, -650);
		fuels[numFuels].scale.set(10,10,10);
		scene.add(fuels[numFuels]);
		numFuels+=1;
	}
}

/*
	move back fuel when it reach end of the scene or hit bumblebee
	check if fuel and obstacle overlap
*/
function moveBackFuel(i){
	var posX = randomPosX();
	fuels[i].position.x = posX;
	for(j=0; j<numFuels; j++){
		var distance = Math.abs(-650 - fuels[j].position.z)
		if(distance < 10 && i != j)
			fuels[i].position.z = -665;
		else
			fuels[i].position.z = -650;
	}
	for(j=0; j<numObstacles; j++){
		var distance = Math.abs(-650 - obstacles[j].position.z)
		if(distance < 10)
			fuels[i].position.z = -665;
		else
			fuels[i].position.z = -650;
	}
}

//render fuels
function renderFuels(){
	for(i=0; i<numFuels; i++){
		if(fuels[i].position.z > 20){
			moveBackFuel(i);
		}
		fuels[i].position.z += speedZ;
		fuels[i].rotation.y += 0.05;
	}
}

/*
	move back obstacle when it reach end of the scene or hit bumblebee
	check if obstacle and fuel overlap
*/
function moveBackObstacle(i){
	var posX = randomPosX();
	obstacles[i].position.x = posX;
	for(j=0; j<numObstacles; j++){
		var distance = Math.abs(-650 - obstacles[j].position.z)
		if(distance < 10 && i != j)
			obstacles[i].position.z = -665;
		else
			obstacles[i].position.z = -650;
	}
	for(j=0; j<numFuels; j++){
		var distance = Math.abs(-650 - fuels[j].position.z)
		if(distance < 10)
			obstacles[i].position.z = -665;
		else
			obstacles[i].position.z = -650;
	}
}

//render obstacles
function renderObstacles(){
	for(i=0; i<numObstacles; i++){
		if(obstacles[i].position.z > 20){
			moveBackObstacle(i);
		}
		obstacles[i].position.z += speedZ;
	}
}

//to check if element and bumblebee are on the same x side (for collision)
function sameSide(pos){
	if(pos > 0 && models['transformer'].position.x > 0) return true;
	else if(pos < 0 && models['transformer'].position.x < 0) return true;
	else if(pos == 0 && models['transformer'].position.x == 0) return true;
	else return false;
}

/*
	check if a collision between bumblebee and obstacle or fuel happens
	in this function is checked if game over happens
*/
function checkCollision(){
	if(lifes > 0){
		for(i=0; i<numObstacles; i++){
			var distance = Math.abs(obstacles[i].position.z - models['transformer'].position.z);
			if(distance <= 50 && sameSide(obstacles[i].position.x)){
				console.log('crash');
				moveBackObstacle(i);
				lifes -= 1;
				var name = "key"+lifes;
				document.getElementById(name).src = "../images/nokey.png";
				context.resume().then(() => {
					audioCrash.play();
					console.log('crash sound');
				});
				if(lifes == 0){
					console.log('gameover');
					game_over = true;
					gameOver();
				} 
			}
		}
		for(i=0; i<numFuels; i++){
			var distance = Math.abs(fuels[i].position.z - models['transformer'].position.z);
			if(distance <= 30 && sameSide(fuels[i].position.x)){
				console.log('fuel');
				moveBackFuel(i);
				score += 1;
				var elem = document.getElementById('scoreNumbers');
				elem.innerHTML = score;
				context.resume().then(() => {
					audioFuel.play();
					console.log('fuel sound');
				});
			}
		}
	}
}

//game over function
function gameOver(){
	var goImg = document.createElement('img');
	goImg.style.position = 'relative';
	goImg.className = 'center';
	goImg.height = 600;
	goImg.style.top = 100 + 'px'
	goImg.src = "../images/game_over.png";

	var back = document.createElement('button');
	back.style.position = "relative";
	back.className = "btn btn-dark btn-lg center";
	back.innerHTML = "Back"; 
	back.addEventListener('click', function(){window.location.href = "../index.html";});

	document.getElementById('gameover').appendChild(goImg);
	document.getElementById('gameover').appendChild(back);
}

//visualization of hearts (keys) on the page
function showHearts(){
	var lifeText = document.createElement('img');
	lifeText.style.position = 'absolute';
	lifeText.height = 100;
	lifeText.width = 100;
	lifeText.style.top = -15 + 'px';
	lifeText.style.left = 10 + 'px';
	lifeText.src = "../images/lifes.png";

	var key0 = document.createElement('img');
	key0.id = 'key0';
	key0.style.position = 'absolute';
	key0.height = 50;
	key0.width = 50;
	key0.style.top = 50 + 'px';
	key0.style.left = 10 + 'px';
	key0.src = "../images/key.png"

	var key1 = document.createElement('img');
	key1.id = 'key1';
	key1.style.position = 'absolute';
	key1.height = 50;
	key1.width = 50;
	key1.style.top = 50 + 'px';
	key1.style.left = 60 + 'px';
	key1.src = "../images/key.png"

	var key2 = document.createElement('img');
	key2.id = 'key2';
	key2.style.position = 'absolute';
	key2.height = 50;
	key2.width = 50;
	key2.style.top = 50 + 'px';
	key2.style.left = 110 + 'px';
	key2.src = "../images/key.png"

	document.getElementById('hearts').appendChild(lifeText);
	document.getElementById('hearts').appendChild(key0);
	document.getElementById('hearts').appendChild(key1);
	document.getElementById('hearts').appendChild(key2);
}

//visualization of score on the page
function showScore(){
	var scoreText = document.createElement('img');
	scoreText.style.position = 'absolute';
	scoreText.height = 105;
	scoreText.width = 105;
	scoreText.style.top = -9 + 'px';
	scoreText.style.right = 10 + 'px';
	scoreText.src = "../images/score.png";

	var scoreNumbers = document.createElement('h1');
	scoreNumbers.id = 'scoreNumbers';
	scoreNumbers.style.position = 'absolute';
	scoreNumbers.style.top = 45 + 'px';
	scoreNumbers.style.right = 30 + 'px';
	scoreNumbers.textContent = '0';

	document.getElementById('score').appendChild(scoreText);
	document.getElementById('score').appendChild(scoreNumbers);
}

function showExitButton(){
	var exit = document.createElement('button');
	exit.style.position = "absolute";
	exit.style.bottom = 10 + 'px';
	exit.style.left = 10 + 'px';
	exit.className = "btn btn-dark btn-lg center";
	exit.innerHTML = "Exit"; 
	exit.addEventListener('click', function(){window.location.href = "../index.html";});

	document.body.appendChild(exit);
}

function allReady(){
	if(models['transformer'] && models['house1'] && models['house2'] && models['house3'] && models['tree'] && models['fuel'] && models['obstacle'])
		return true;
	else
		return false;
}

// RENDER THE SCENE
function render(){
	renderer.render(scene, camera);
	if(allReady()){
		renderTransformer();
		renderHouses();
		renderTrees();
		renderFuels();
		renderObstacles();
		checkCollision();
		if(clock.getElapsedTime() > maxTime){
			clock.start();
			loadElements();
		}
	}		
	requestAnimationFrame(render);
}

function main(){
	initAll();
	showExitButton();
	showHearts();
	showScore();
	setSky();
	setGround();
	loadModels();
	setLevel();
	render();
}

main();