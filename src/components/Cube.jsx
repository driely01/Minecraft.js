import { useEffect, useRef } from "react";
import * as THREE from 'three'
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { World } from "../utils/world";
import { createUI } from "../utils/ui";

function firstCube(canvas, parent) {

	// stats
	const stats = new Stats()
	document.body.append(stats.dom)

	// renderer
	const renderer = new THREE.WebGLRenderer({canvas})
	renderer.setPixelRatio(devicePixelRatio)
	renderer.setSize(parent.offsetWidth,parent.offsetHeight)
	renderer.setClearColor(0x80a0e0)

	// camera
	const camera = new THREE.PerspectiveCamera(75, parent.offsetWidth / parent.offsetHeight)
	camera.position.set(-32, 16, -32)

	// controls
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.target.set(16, 0, 16)
	controls.update()

	// scene
	const scene = new THREE.Scene()
	const world = new World()
	world.generate()
	scene.add(world)

	function setupLights() {
		const light1 = new THREE.DirectionalLight()
		light1.position.set(1, 1, 1)
		scene.add(light1)

		const light2 = new THREE.DirectionalLight()
		light2.position.set(-1, 1, -0.5)
		scene.add(light2)

		const ambient = new THREE.AmbientLight()
		ambient.intensity = 0.1
		scene.add(ambient)
	}

	function animate() {
		requestAnimationFrame(animate)
		stats.update()
		renderer.render(scene, camera)
	}

	window.addEventListener('resize', () => {
		camera.aspect = parent.offsetWidth /parent.offsetHeight
		camera.updateProjectionMatrix()
		controls.update()
		renderer.setSize(parent.offsetWidth,parent.offsetHeight)
	})

	setupLights()
	createUI(world)
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
			<canvas ref={canvasRef} className="w-full h-full"></canvas>
		</div>
	)
}

export default Cube