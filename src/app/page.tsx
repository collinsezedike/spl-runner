'use client'

import { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
	Connection,
	Keypair,
	PublicKey,
	clusterApiUrl,
	SystemProgram,
	TransactionMessage,
	VersionedTransaction,
} from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

import {
	createInitializeMintInstruction,
	createInitializeNonTransferableMintInstruction,
	ExtensionType,
	getMintLen,
	TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
interface GameObject {
	x: number
	y: number
	width: number
	height: number
}

const DinoGame = () => {
	const { publicKey, signTransaction, sendTransaction } = useWallet()
	const CLUSTER_URL = clusterApiUrl('devnet')

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [gameOver, setGameOver] = useState(false)
	const [score, setScore] = useState(0)
	const [startGame, setStartGame] = useState(false)
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
		const handleResize = () => setScreenWidth(window.innerWidth)
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])
	useEffect(() => {
		if (!startGame) return // Ensure the game starts only when `startGame` is true

		const canvas = canvasRef.current
		if (!canvas) return
		const context = canvas.getContext('2d')
		if (!context) return

		const dino = { x: dinoX, y: dinoY, width: dinoWidth, height: dinoHeight }

		const update = () => {
			if (gameOverRef.current) return

			animationFrameId.current = requestAnimationFrame(update)
			context.clearRect(0, 0, screenWidth, boardHeight)
			drawRoad(context)

			velocityY += gravity
			dino.y = Math.min(dino.y + velocityY, dinoY)

			frameCount++
			if (frameCount % 10 === 0) {
				currentDinoImage = (currentDinoImage + 1) % 2
			}
			const currentDinoImg = currentDinoImage === 0 ? dinoImg1 : dinoImg2
			context.drawImage(currentDinoImg, dino.x, dino.y, dino.width, dino.height)

			cactusArray = cactusArray.filter((cactus) => cactus.x + cactus.width > 0)

			if (!gameOverRef.current) {
				setScore((prev) => prev + 0.001)
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
					gameOverRef.current = true
					setGameOver(true)
					setStartGame(false)
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

		document.addEventListener('keydown', moveDino)
		const cactusInterval = setInterval(placeCactus, 1000)
		animationFrameId.current = requestAnimationFrame(update)

		return () => {
			document.removeEventListener('keydown', moveDino)
			clearInterval(cactusInterval)
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current)
			}
		}
	}, [startGame])

	function detectCollision(a: GameObject, b: GameObject): boolean {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.y + a.height > b.y
		)
	}

	// Restart game
	const restartGame = () => {
		window.location.reload()
	}
	const drawRoad = (context: CanvasRenderingContext2D) => {
		road.x -= 8

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

	const handleClick = async () => {
		if (!publicKey) {
			console.error('Wallet not connected!')
			return
		}

		const userWalletAddress = publicKey.toBase58()

		try {
			// Step 1: Fetch Serialized Transaction from Backend
			// const response = await axios.post('/onchain/create-token', {
			// 	name: 'tester',
			// 	symbol: 'TST',
			// 	description: 'This is a test',
			// 	image: 'runner',
			// 	authority: 'none',
			// 	address: userWalletAddress,
			// })

			// const serializedTxn = response.data.txn
			// console.log('Serialized Transaction:', serializedTxn)

			// // Step 2: Deserialize the Transaction
			// const txBuffer = Buffer.from(serializedTxn, 'base64')
			// const transaction = VersionedTransaction.deserialize(txBuffer)
			// console.log('Deserialized Transaction:', transaction)

			// Backend code
			const connection = new Connection(CLUSTER_URL)
			const { blockhash } = await connection.getLatestBlockhash()

			const mintKeypair = Keypair.generate()
			const mint = mintKeypair.publicKey
			const decimals = 2
			const mintLen = getMintLen([ExtensionType.NonTransferable])
			const lamports = await connection.getMinimumBalanceForRentExemption(
				mintLen
			)

			const createAccountIxn = SystemProgram.createAccount({
				fromPubkey: publicKey,
				newAccountPubkey: mint,
				space: mintLen,
				lamports,
				programId: TOKEN_2022_PROGRAM_ID,
			})

			const initializeNonTransferableMintIxn =
				createInitializeNonTransferableMintInstruction(
					mint,
					TOKEN_2022_PROGRAM_ID
				)

			const initializeMintIxn = createInitializeMintInstruction(
				mint,
				decimals,
				publicKey,
				null,
				TOKEN_2022_PROGRAM_ID
			)

			const transferSOLIxn = SystemProgram.transfer({
				fromPubkey: publicKey,
				toPubkey: new PublicKey('DqZdf8MQkbJTkghf25cnzJNSmfmdzKseeVHxgL4qJKnw'),
				lamports: 1000,
			})

			const message = new TransactionMessage({
				payerKey: publicKey,
				recentBlockhash: blockhash,
				instructions: [
					// createAccountIxn,
					// initializeNonTransferableMintIxn,
					// initializeMintIxn,
					transferSOLIxn,
				],
			}).compileToV0Message()

			const txn = new VersionedTransaction(message)

			// Step 3: Sign the Transaction
			if (!signTransaction) {
				console.error('Wallet does not support signing!')
				return
			}

			const txnSignature = await sendTransaction(txn, connection)
			console.log('Transaction:', txn)
			console.log('Signed Transaction:', txnSignature)
		} catch (error: any) {
			console.error('Error processing transaction:', error)

			// Get full logs from transaction failure
			if (error.logs) {
				console.error('Transaction Logs:', error.logs)
			}
		}
	}

	if (!startGame) {
		return (
			<div
			// style={{
			// 	display: 'flex',
			// 	flexDirection: 'column',
			// 	alignItems: 'center',
			// 	width: '100vw',
			// 	height: '100vh',
			// 	justifyContent: 'center',
			// }}
			>
				<WalletMultiButton />
				<button
					style={{
						fontSize: '2rem',
						fontWeight: '700',
						padding: '1rem 1.5rem',
						border: '1.5px solid black',
						borderRadius: '15px',
					}}
					onClick={handleClick}
				>
					start game
				</button>
			</div>
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
					<img
						src="/game-over.png"
						alt=""
					/>
					<button
						onClick={restartGame}
						style={{ border: 'none' }}
					>
						<img
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
