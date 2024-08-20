import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'

export class Player {
	maxSpeed = 10
	input = new THREE.Vector3()
	velocity = new THREE.Vector3()
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200)
	controls = new PointerLockControls(this.camera, document.body)
	cameraHelper = new THREE.CameraHelper(this.camera)

	/**
	 * @param {THREE.Scene} scene 
	 */
	constructor(scene) {
		this.position.set(32, 16, 32)
		scene.add(this.camera)
		scene.add(this.cameraHelper)
		document.addEventListener('keydown', this.onKeyDown.bind(this))
		document.addEventListener('keyup', this.onKeyUp.bind(this))
	}

	applyInputs(delta) {
		if (this.controls.isLocked) {
			this.velocity.x = this.input.x
			this.velocity.z = this.input.z
			this.controls.moveRight(this.velocity.x * delta)
			this.controls.moveForward(this.velocity.z * delta)

			document.getElementById('player-position').innerHTML = this.toString()
		}
	}
	/**
	 * returns the current world position of the player
	 * @type {THREE.Vector3}
	 */
	get position() {
		return this.camera.position
	}

	/**
	 * event handler for 'keydown' event
	 * @param {KeyboardEvent} event 
	 */
	onKeyDown(event) {
		if (!this.controls.isLocked) {
			this.controls.lock()
			console.log('controld locked')
		}
		switch(event.code) {
			case 'KeyW':
				this.input.z = this.maxSpeed
				break
			case 'KeyA':
				this.input.x = -this.maxSpeed
				break
			case 'KeyS':
				this.input.z = -this.maxSpeed
				break
			case 'KeyD':
				this.input.x = this.maxSpeed
				break
			case 'KeyR':
				this.position.set(32, 16, 32)
				this.velocity.set(0, 0, 0)
				break
		}
	}

	/**
	 * event handler for 'keyup' event
	 * @param {KeyboardEvent} event 
	 */
	onKeyUp(event) {
		console.log('keyup')
		switch(event.code) {
			case 'KeyW':
				this.input.z = 0
				break
			case 'KeyA':
				this.input.x = 0
				break
			case 'KeyS':
				this.input.z = 0
				break
			case 'KeyD':
				this.input.x = 0
				break
		}
	}

	toString() {
		let str = ''
		str += `X: ${this.position.x.toFixed(2)}  `
		str += `Y: ${this.position.y.toFixed(2)}  `
		str += `Z: ${this.position.z.toFixed(2)}`
		return str
	}
}