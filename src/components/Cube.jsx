import { useEffect, useRef } from "react";
import * as THREE from 'three'
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { World } from "../utils/world";
import { createUI } from "../utils/ui";
import { Player } from "../utils/player";

function firstCube(canvas, parent) {
	
	// stats
	const stats = new Stats()
	document.body.append(stats.dom)
	
	// renderer
	const renderer = new THREE.WebGLRenderer({canvas})
	renderer.setPixelRatio(devicePixelRatio)
	renderer.setSize(parent.offsetWidth,parent.offsetHeight)
	renderer.setClearColor(0x80a0e0)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	
	// camera
	const orbitCamera = new THREE.PerspectiveCamera(75, parent.offsetWidth / parent.offsetHeight)
	orbitCamera.position.set(-20, 20, -20)

	// controls
	const controls = new OrbitControls(orbitCamera, renderer.domElement)
	controls.target.set(16, 0, 16)
	controls.update()
	
	// scene
	const scene = new THREE.Scene()
	const world = new World()
	world.generate()
	scene.add(world)
	
	const player = new Player(scene)
	createUI(world, player)
	
	function setupLights() {
		const sun = new THREE.DirectionalLight()
		sun.position.set(50, 50, 50)
		sun.castShadow = true
		sun.shadow.camera.left = -50
		sun.shadow.camera.right = 50
		sun.shadow.camera.bottom = -50
		sun.shadow.camera.top = 50
		sun.shadow.camera.near = 0.1
		sun.shadow.camera.far = 100
		sun.shadow.bias = -0.0005
		sun.shadow.mapSize = new THREE.Vector2(512, 512)
		scene.add(sun)

		// const shadowHelper = new THREE.CameraHelper(sun.shadow.camera)
		// scene.add(shadowHelper)
		const ambient = new THREE.AmbientLight()
		ambient.intensity = 0.1
		scene.add(ambient)
	}

	// render loop
	let previousTime = performance.now()
	function animate() {
		let currentTime = performance.now()
		let delta = (currentTime - previousTime) / 1000

		requestAnimationFrame(animate)
		player.applyInputs(delta)
		stats.update()
		renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera)

		previousTime = currentTime
	}

	window.addEventListener('resize', () => {
		orbitCamera.aspect = parent.offsetWidth / parent.offsetHeight
		orbitCamera.updateProjectionMatrix()
		player.camera.aspect = parent.offsetWidth / parent.offsetHeight
		player.camera.updateProjectionMatrix()
		controls.update()
		renderer.setSize(parent.offsetWidth,parent.offsetHeight)
	})

	setupLights()
	animate()
}
const Cube = () => {
	const canvasRef = useRef(null)
	const parentRef = useRef(null)
	useEffect(() => {
		if (canvasRef.current) {
			firstCube(canvasRef.current, parentRef.current)
		}
	})
	return (
		<div className="w-full h-screen" ref={parentRef}>
			<div className="absolute bottom-0 right-0 px-10 py-5 font-bold text-2xl text-yellow-300" id='info'>
				<div id='player-position'></div>
			</div>
			<canvas ref={canvasRef} className="w-full h-full"></canvas>
		</div>
	)
}

export default Cube