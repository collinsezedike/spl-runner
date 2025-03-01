'use client'

import NextImage from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface GameObject {
	x: number
	y: number
	width: number
	height: number
}

const DinoGame = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [gameOver, setGameOver] = useState(false)
	const [score, setScore] = useState(0)
	const gameOverRef = useRef(false) // Tracks game state synchronously
	const animationFrameId = useRef<number | null>(null)

	const [screenWidth, setScreenWidth] = useState(window.innerWidth)
	const boardHeight = 250

	// Dino properties
	const dinoWidth = 88
	const dinoHeight = 94
	const dinoX = 20
	const dinoY = boardHeight - dinoHeight

	let velocityY = 0
	const gravity = 0.45

	// Dino Images for Animation
	const dinoImages = ['/dino-run1.png', '/dino-run2.png']
	const dinoImg1 = new Image()
	const dinoImg2 = new Image()
	dinoImg1.src = dinoImages[0]
	dinoImg2.src = dinoImages[1]

	// Load Road Image
	const roadImg = new Image()
	roadImg.src = '/track.png' // Ensure the path is correct

	const road = { x: 0, y: boardHeight - 50, width: screenWidth, height: 50 }

	let currentDinoImage = 0 // Used to alternate between images
	let frameCount = 0 // Used to slow down image switching

	const cactusImages = [
		'cactus1.png',
		'cactus2.png',
		'cactus3.png',
		'big-cactus1.png',
		'big-cactus2.png',
	].map((src) => {
		const img = new Image()
		img.src = src
		return img
	})

	let cactusArray: {
		img: HTMLImageElement
		x: number
		y: number
		width: number
		height: number
	}[] = []
	const velocityX = -8

	// Handle screen resizing
	useEffect(() => {
		if (typeof window !== 'undefined') {
			setScreenWidth(window.innerWidth)

			// Handle screen resizing
			const handleResize = () => setScreenWidth(window.innerWidth)
			window.addEventListener('resize', handleResize)

			return () => window.removeEventListener('resize', handleResize)
		}
	}, [])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const context = canvas.getContext('2d')
		if (!context) return

		const dino = { x: dinoX, y: dinoY, width: dinoWidth, height: dinoHeight }

		const update = () => {
			if (gameOverRef.current) return // Stop the game loop when gameOverRef is true

			animationFrameId.current = requestAnimationFrame(update)
			context.clearRect(0, 0, screenWidth, boardHeight)

			drawRoad(context) // Draw road first, so dino and cactus appear on top

			velocityY += gravity
			dino.y = Math.min(dino.y + velocityY, dinoY)

			// Slow down dino animation (switch image every 10 frames)
			frameCount++
			if (frameCount % 10 === 0) {
				currentDinoImage = (currentDinoImage + 1) % 2
			}
			const currentDinoImg = currentDinoImage === 0 ? dinoImg1 : dinoImg2

			context.drawImage(currentDinoImg, dino.x, dino.y, dino.width, dino.height)

			cactusArray = cactusArray.filter((cactus) => cactus.x + cactus.width > 0)

			if (!gameOverRef.current) {
				setScore((prev) => prev + 0.001) // Update score only if the game is still running
			}

			cactusArray.forEach((cactus) => {
				cactus.x += velocityX
				context.drawImage(
					cactus.img,
					cactus.x,
					cactus.y,
					cactus.width,
					cactus.height
				)

				if (detectCollision(dino, cactus)) {
					gameOverRef.current = true // Stop future updates immediately
					setGameOver(true)
				}
			})
		}

		const placeCactus = () => {
			if (gameOverRef.current) return
			const randomIndex = Math.floor(Math.random() * cactusImages.length)
			cactusArray.push({
				img: cactusImages[randomIndex],
				x: screenWidth,
				y: boardHeight - 70,
				width: [34, 69, 102][randomIndex],
				height: 70,
			})
			if (cactusArray.length > 5) cactusArray.shift()
		}

		const moveDino = (e: KeyboardEvent) => {
			if (gameOverRef.current) return
			if ((e.code === 'Space' || e.code === 'ArrowUp') && dino.y === dinoY) {
				velocityY = -10
			}
		}

		function detectCollision(a: GameObject, b: GameObject): boolean {
			return (
				a.x < b.x + b.width && //a's top left corner doesn't reach b's top right corner
				a.x + a.width > b.x && //a's top right corner passes b's top left corner
				a.y < b.y + b.height && //a's top left corner doesn't reach b's bottom left corner
				a.y + a.height > b.y
			) //a's bottom left corner passes b's top left corner
		}

		document.addEventListener('keydown', moveDino)
		const cactusInterval = setInterval(placeCactus, 1000)
		animationFrameId.current = requestAnimationFrame(update)

		return () => {
			document.removeEventListener('keydown', moveDino)
			clearInterval(cactusInterval)
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current) // Stop animation loop on cleanup
			}
		}
	}, [])

	// Restart game
	const restartGame = () => {
		window.location.reload()
	}
	const drawRoad = (context: CanvasRenderingContext2D) => {
		// Move the road to create scrolling effect
		road.x -= 8 // Same as cactus speed

		// Reset position when out of view (looping effect)
		if (road.x <= -screenWidth) {
			road.x = 0
		}

		// Draw the road twice to create a seamless loop
		context.drawImage(roadImg, road.x, road.y, road.width, road.height)
		context.drawImage(
			roadImg,
			road.x + screenWidth,
			road.y,
			road.width,
			road.height
		)
	}

	return (
		<>
			<p>Score: {score.toFixed(2)}</p>
			{gameOver && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						position: 'absolute',
						top: 50,
						width: '100vw',
					}}
				>
					<NextImage
						src="/game-over.png"
						alt=""
					/>
					<button
						onClick={restartGame}
						style={{ border: 'none' }}
					>
						<NextImage
							src="/reset.png"
							alt=""
						/>
					</button>
				</div>
			)}
			<canvas
				ref={canvasRef}
				width={screenWidth}
				height={boardHeight}
				id="board"
			/>
		</>
	)
}

export default DinoGame
