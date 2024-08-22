import * as THREE from 'three'
import { Player } from './player'
import { blocks } from './block'

const collisionMaterial = new THREE.MeshBasicMaterial({
	color: 0xff0000,
	transparent: true,
	opacity: 0.2
})
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001)

const contactMaterial = new THREE.MeshBasicMaterial({
	wireframe: true,
	color: 0x00ff00
})
const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6)

export class Physics {
	simulationRate = 200
	timestep = 1 / this.simulationRate
	accumulator = 0

	gravity = 32;

	constructor(scene) {
		this.helpers = new THREE.Group()
		scene.add(this.helpers)
	}

	/**
	 * moves the physics simulation forward in the time by 'delta'
	 * @param {number} delta 
	 * @param {Player} player 
	 * @param {World} world 
	*/
	update(delta, player, world) {
		this.accumulator += delta

		while (this.accumulator >= this.timestep) {
			this.helpers.clear()
			player.velocity.y -= this.gravity * this.timestep
			player.applyInputs(this.timestep)
			player.updateBoundsHelper()
			this.detectCollisions(player, world)
			this.accumulator -= this.timestep
		}
	}

	/**
	 * possible blocks the player may be colliding with
	 * @param {Player} player 
	 * @param {World} world 
	 * @returns {[]}
	 */
	broadPhase(player, world) {
		const condidates = []

		// get the extents of the player
		const extents = {
			x: {
				min: Math.floor(player.position.x - player.radius),
				max: Math.ceil(player.position.x + player.radius)
			},
			y: {
				min: Math.floor(player.position.y - player.height),
				max: Math.ceil(player.position.y)
			},
			z: {
				min: Math.floor(player.position.z - player.radius),
				max: Math.ceil(player.position.z + player.radius)
			}
		}

		// loop through all blocks within the player's extents
		// if they aren't empty, then they are a possible collision condidate
		for (let x = extents.x.min; x <= extents.x.max; x++) {
			for (let y = extents.y.min; y <= extents.y.max; y++) {
				for (let z = extents.z.min; z <= extents.z.max; z++) {
					const block = world.getBlock(x, y, z)
					if (block && block.id !== blocks.empty.id) {
						const blockPos = {x, y, z}
						condidates.push(blockPos)
						this.addCollisionHelper(blockPos)
					}
				}
			}
		}
		console.log(`broadphase condidates: ${condidates.length}`)
		return condidates
	}

	/**
	 * narrows down the blocks found in the broad-phase to the set
	 * of blocks the player is actually colliding with
	 * @param {{x: number, y: number, z: number}} condidates 
	 * @param {Player} player 
	 * @returns 
	 */
	narrowPhase(condidates, player) {
		const collisions = []

		for (const block of condidates) {
			// 1. get the point on the block that is closest to the center of the player's bounding cylinder
			const position = player.position
			const closestPoint = {
				x: Math.max(block.x - 0.5, Math.min(position.x, block.x + 0.5)),
				y: Math.max(block.y - 0.5, Math.min(position.y - (player.height / 2), block.y + 0.5)),
				z: Math.max(block.z - 0.5, Math.min(position.z, block.z + 0.5))
			}

			// 2. determine if point is inside the player's bounding cylinder
			// get distance along each exis between closest point and the center of the player's bounding cylinder
			const dx = closestPoint.x - player.position.x
			const dy = closestPoint.y - (player.position.y - (player.height / 2))
			const dz = closestPoint.z - player.position.z

			if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {
				// compute the overlap between th point and the player's bounding cylinder
				// along the y-axis and in the xz-plane
				const overlapY = (player.height / 2) - Math.abs(dy)
				const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz)
				
				// compute the normal of the collision (pointing away from the contact point)
				// and the overlap between the point and the player's bounding cylinder
				let normal, overlap
				if (overlapY < overlapXZ) {
					normal = new THREE.Vector3(0, -Math.sign(dy), 0)
					overlap = overlapY
					player.onGround = true
				} else {
					normal = new THREE.Vector3(-dx, 0, -dz).normalize()
					overlap = overlapXZ
				}

				collisions.push({
					block,
					contactPoint: closestPoint,
					normal,
					overlap
				})

				this.addContactPointHelper(closestPoint)
			}
		}

		console.log(`Narrows collisions: ${collisions.length}`)
		return collisions;
	}

	/**
	 * main function for collision detection
	 * @param {Player} player 
	 * @param {World} world 
	 */
	detectCollisions(player, world) {
		player.onGround = false
		const condidates = this.broadPhase(player, world)
		const collisions = this.narrowPhase(condidates, player)

		if (collisions.length > 0) {
			this.resolveCollisions(collisions, player)
		}
	}

	/**
	 * resolve each of the collisions found in the narrow-phase
	 * @param {object} collisions 
	 * @param {Player} player 
	 */
	resolveCollisions(collisions, player) {
		// resolve the collisons in order of the smallest overlap to the largest
		collisions.sort((a, b) => {
			return a.overlap < b.overlap
		})
	
		for (const collision of collisions) {
			// we need to re-check contact point is inside the player bounding cylinder
			// for each collision since the player position is updated after each collision is resolved
			if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player))
				continue

			// 1. adjust player position so it is no longer ovelapping with colliding block
			let deltaPosition = collision.normal.clone()
			deltaPosition.multiplyScalar(collision.overlap)
			player.position.add(deltaPosition)

			// 2. negate player's velocity along the collision normal
			// get the magnitude of the player's velocity along the collision normal
			let magnitude = player.getWorldVelocity().dot(collision.normal)
			
			// remove that part of the velocity from the player's velocity
			let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude)

			// apply the volicity to the player
			player.applyWorldDeltaVelocity(velocityAdjustment.negate())
		}
	}

	/**
	 * visualizes the block the player is colliding with
	 * @param {THREE.Object3D} block
	*/
	addCollisionHelper(block) {
		const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial)
		blockMesh.position.copy(block)
		this.helpers.add(blockMesh)
	}

	/**
	 * visualizes the contact at the point 'p'
	 * @param {{x, y, z}} p 
	 */
	addContactPointHelper(p) {
		const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial)
		contactMesh.position.copy(p)
		this.helpers.add(contactMesh)
	}

	/**
	 * returns true if the point 'p' is inside the player's bounding cylinder
	 * @param {{x: number, y: number, z: number}} p 
	 * @param {Player} player 
	 * @returns {boolean}
	 */
	pointInPlayerBoundingCylinder(p, player) {
		const dx = p.x - player.position.x
		const dy = p.y - (player.position.y - (player.height / 2))
		const dz = p.z - player.position.z
		const r_sq = dx * dx + dz * dz

		// check if contact point is inside the player's bounding cylinder
		return (Math.abs(dy) < player.height / 2) && (r_sq < player.radius * player.radius)
	}
}