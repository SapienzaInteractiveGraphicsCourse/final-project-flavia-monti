var width = window.innerWidth;
var height = window.innerHeight;
var Colors = {
	red: 0xd61313,
	green: 0x408622,
	white: 0xffffff,
	brown: 0x643b35,
	pink: 0xf1986f,
	brownDark: 0x271b10,
	gray: 0xD3D3D3,
	aliceBlue: 0xF0F8FF,
	blue: 0x0078ff,
	ligherBlack: 0x404040,
  black: 0x000000,
  yellow: 0xfafc2d,
};

var renderer = new THREE.WebGLRenderer({ antialias: true });
var scene = new THREE.Scene;
var camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
var textLoader = new THREE.TextureLoader();
var loader = new THREE.GLTFLoader();
var clock;

function removeElem(id){
	var element = document.getElementById(id);
	element.parentNode.removeChild(element);
}

