import {Game} from "./dummyette/chess.js"
import {toSpeed, toEventPlayer, globalController} from "./utils.js"
import {LiveController} from "./dummyette/streams.js"
import {toSAN} from "./dummyette/notation.js"

let games = new Map()

export let createGame = ({fullID, rated = false, variant, initialFen = "startpos", clock, white, black}) =>
{
	let id = fullID.slice(0, 8)
	
	let status = "created"
	
	let game = Game()
	
	let getTurn = () => game.boards[game.boards.length - 1].turn
	
	let t0
	let time = {white: clock?.time, black: clock?.time}
	
	let getTime = color =>
	{
		if (!clock) return
		
		if (status !== "started")
			return time[color]
		if (getTurn() === color)
			return time[color]
		
		let t = performance.now() - t0
		return time[color] - t
	}
	
	let winner
	
	let checkClock = () =>
	{
		let winner0
		if (getTime("white") < 0) winner0 = "black", time.white = 0
		if (getTime("black") < 0) winner0 = "white", time.black = 0
		
		if (winner0)
		{
			winner = winner0
			status = "outoftime"
			end()
		}
	}
	
	let end = () =>
	{
		time.white = getTime("white")
		time.black = getTime("black")
		if (!controller.finished)
		{
			controller.push(json.state)
			controller.finish()
		}
		globalController.push({target: white.username, value: getEvent("gameFinish", "white", black, true, false)})
		globalController.push({target: black.username, value: getEvent("gameFinish", "black", white, true, false)})
	}
	
	let speed = toSpeed(clock)
	
	let json =
	{
		type: "gameFull",
		id,
		rated,
		variant: {key: variant},
		clock,
		createdAt: Date.now(),
		white: toEventPlayer(white),
		black: toEventPlayer(black),
		initialFen,
		speed,
		state:
		{
			type: "gameState",
			get moves() { return game.moves.map(({name}) => name).join(" ") },
			get wtime() { return Math.max(0, Math.floor(getTime("white"))) },
			get btime() { return Math.max(0, Math.floor(getTime("black"))) },
			winc: clock?.increment,
			binc: clock?.increment,
			get status() { return status },
			get winner() { return winner },
		},
	}
	
	let lastMoveAt = json.createdAt
	
	let exportJSON =
	{
		id,
		rated,
		variant,
		speed,
		perf: speed,
		createdAt: json.createdAt,
		get lastMoveAt() { return lastMoveAt },
		get status() { return status },
		players:
		{
			white:
			{
				user: toEventPlayer(white),
				rating: 1500,
				ratingDiff: 0,
			},
			black:
			{
				user: toEventPlayer(black),
				rating: 1500,
				ratingDiff: 0,
			},
		},
		get moves() { return game.moves.map(move => toSAN(move)).join(" ") },
		clock,
	}
	
	let getEvent = (type, color, opponent, hasMoved, isMyTurn) =>
	({
		type,
		game:
		{
			id,
			fullId: fullID,
			color,
			fen: "startpos",
			hasMoved,
			isMyTurn,
			lastMove: game.moves[game.moves.length - 1]?.name,
			opponent: toEventPlayer(opponent),
			perf: speed,
			rated,
			secondsLeft: clock?.time,
			source: "friend",
			speed,
			variant: {key: variant},
			compat:
			{
				bot: true,
				board: false,
			},
		}
	})
	
	globalController.push({target: white.username, value: getEvent("gameStart", "white", black, false, true)})
	globalController.push({target: black.username, value: getEvent("gameStart", "black", white, false, false)})
	
	let controller = LiveController()
	let events = controller.stream
	
	let del = () =>
	{
		status = "aborted"
		end()
		games.delete(game)
	}
	let countdown = setTimeout(del, 30000)
	
	let result =
	{
		toJSON: () => { checkClock() ; return json },
		export: () => exportJSON,
		events,
		play: (moveName, by) =>
		{
			let turn = getTurn()
			
			let username
			if (turn === "white")
				username = white.username
			else
				username = black.username
			
			if (by.username !== username) return "It is not your turn."
			
			if (status !== "started")
			{
				if (status !== "created") return "The game is already over."
				if (game.moves === 1) status = "started"
			}
			
			let next = Game(...game.moves, moveName)
			if (next === undefined) return "The move name is invalid."
			
			game = next
			lastMoveAt = Date.now()
			
			if (clock) time[turn] = getTime(turn) + clock.increment
			
			clearTimeout(countdown)
			countdown = setTimeout(del, 5 * 60000)
			
			let board = game.boards[game.boards.length - 1]
			if (board.moves.length === 0)
			{
				if (board.check) status = "mate"
				else status = "stalemate"
				end()
				return
			}
			
			controller.push(json.state)
		},
		resign: by =>
		{
			if (status !== "started")
			if (status !== "created")
				return "The game is already over."
			
			let winner0
			if (by.username === white.username)
				winner0 = "black"
			if (by.username === black.username)
				winner0 = "black"
			
			if (!winner0) return "You are not playing this game."
			
			status = "resign"
			winner = winner0
			end()
		},
		creation: json.createdAt,
		speed,
		get status() { return status },
		white, black,
	}
	
	games.set(id, result)
	return result
}

export let getGame = id => games.get(id)

export let getGames = () => [...games.values()]
