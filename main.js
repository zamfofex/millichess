import {LiveController, LiveJoinStream} from "./dummyette/streams.js"
import {pages} from "./pages.js"
import {Color} from "./dummyette/chess.js"
import {fromFEN} from "./dummyette/notation.js"
import {createPlayer, getPlayer, getPlayerWithoutRefreshing} from "./players.js"
import {getGame} from "./games.js"
import {createChallenge, getChallenge} from "./challenges.js"
import {nextRandom, removePrefix, globalEvents} from "./utils.js"
import {toNDJSON} from "./streams.js"

// note: These handling functions are too long!
// todo: Figure out a way to refactor these functions.

let handleGET = async (username, event, connection, error, ok) =>
{
	let {hostname} = connection.remoteAddr
	
	let {request} = event
	let {pathname} = new URL(request.url)
	
	if (pathname === "/api/account")
	{
		if (!username) username = "somebot" + nextRandom()
		
		let player = getPlayer(username, hostname)
		if (typeof player === "string")
		{
			error(player)
			return
		}
		
		event.respondWith(new Response(JSON.stringify(player), {headers: {"Content-Type": "application/json"}})).catch(() => { })
	}
	
	if (pathname === "/api/stream/event")
	{
		let player = getPlayer(username, hostname)
		if (typeof player === "string")
		{
			error(player)
			return
		}
		
		let events = globalEvents
			.filter(({target}) => target === username)
			.map(({value}) => value)
		
		player.keep()
		event.respondWith(toNDJSON(events))
			.catch(() => { })
			.then(() => player.drop())
		
		return
	}
	
	let path
	if (path = removePrefix(pathname, "/api/bot/game/stream/"))
	{
		let game = getGame(path)
		if (!game)
		{
			error("This game does not exist.", 404)
			return
		}
		
		let events = LiveJoinStream([game], game.events)
		event.respondWith(toNDJSON(events)).catch(() => { })
		
		return
	}
	
	if (pages.has(pathname))
	{
		let page = pages.get(pathname)
		event.respondWith(new Response(page.text, {headers: {"Content-Type": page.type}})).catch(() => { })
		return
	}
	
	event.respondWith(new Response("not found", {status: 404})).catch(() => { })
}

let handlePOST = async (username, event, connection, error, ok) =>
{
	let {hostname} = connection.remoteAddr
	
	let {request} = event
	let {pathname} = new URL(request.url)
	
	let path
	if (path = removePrefix(pathname, "/api/bot/game/"))
	{
		let player = getPlayer(username, hostname)
		if (typeof player === "string")
		{
			error(player)
			return
		}
		
		let [gameID, action, ...rest] = path.split("/")
		if (action === "chat" && rest.length === 0)
		{
			// todo: Handle chat.
			ok()
			return
		}
		
		if (action === "resign" && rest.length === 0)
		{
			let game = getGame(gameID)
			if (!game)
			{
				error("This game does not exist.", 404)
				return
			}
			
			let message = game.resign(player)
			if (message)
			{
				error(message)
				return
			}
			
			ok()
			return
		}
		
		if (action === "move" && rest.length === 1)
		{
			let move = rest[0]
			
			let game = getGame(gameID)
			if (!game)
			{
				error("This game does not exist.", 404)
				return
			}
			
			let message = game.play(move, player)
			if (message)
			{
				error(message)
				return
			}
			
			ok()
			return
		}
		
		error("The specified game action is invalid.")
		return
	}
	
	if (path = removePrefix(pathname, "/api/challenge/"))
	{
		let [id, ...rest] = path.split("/")
		
		if (rest.length === 1)
		{
			let action = rest[0]
			
			let player = getPlayer(username, hostname)
			if (typeof player === "string")
			{
				error(player)
				return
			}
			
			let challenge = getChallenge(id)
			if (!challenge)
			{
				error("The given challenge does not exist.")
				return
			}
			
			if (action === "accept")
			{
				challenge.accept(player)
				ok()
				return
			}
			if (action === "decline")
			{
				challenge.decline(player)
				ok()
				return
			}
			
			error("The specified challenge action is invalid.")
			return
		}
		
		if (rest.length === 0)
		{
			let from = getPlayer(username, hostname)
			if (typeof from === "string")
			{
				error(from)
				return
			}
			
			path = path.toLowerCase()
			let to = getPlayerWithoutRefreshing(path)
			if (!to)
			{
				error("The challenged player does not exist.")
				return
			}
			
			// todo: Handle 'application/x-www-form-urlencoded'.
			let body
			if (request.headers.get("Content-Type") === "application/json")
				body = await request.json().catch(() => { })
			
			if (!body)
			{
				error("The request body is invalid.")
				return
			}
			
			let {rated = false, clock, days, color = "random", variant = "standard", fen, keepAliveStream, acceptByToken, message} = body
			
			if (typeof rated !== "boolean")
			{
				error("'rated' should be a boolean.")
				return
			}
			
			if (clock !== undefined)
			{
				if (days !== undefined)
				{
					error("Correspondence games cannot have a given clock.")
					return
				}
				
				if (typeof clock !== "object" || clock instanceof Array)
				{
					error("The given clock must be an object.")
					return
				}
				
				let {limit, increment} = clock
				if (typeof limit !== "number")
				{
					error("The given clock limit must be a number.")
					return
				}
				if (typeof increment !== "number")
				{
					error("The given clock increment must be a number.")
					return
				}
				
				if (limit < 0 || limit > 10800)
				{
					error("The clock limit is out of bounds.")
					return
				}
				if (increment < 0 || increment > 60)
				{
					error("The clock increment is out of bounds.")
					return
				}
				
				if (increment === 0 && limit === 0)
				{
					error("Either the clock increment or the clock limit must be greater than 0.")
					return
				}
				
				clock = {time: limit, increment}
			}
			
			if (color !== "random") color = Color(color)
			if (color === undefined)
			{
				error(`Invalid challenge color, must be either "white", "black" or "random".`)
				return
			}
			
			if (variant !== "standard")
			{
				error(`The variant must be "standard" for now.`)
				return
			}
			
			if (fen !== undefined)
			{
				error("The initial FEN must not be specified for now.")
				return
			}
			
			if (typeof keepAliveStream !== "boolean")
			{
				error("'keepAliveStream' should be a boolean.")
				return
			}
			
			if (message !== undefined || acceptByToken !== undefined)
			{
				error("Using 'acceptByToken' is not allowed.")
				return
			}
			
			if (keepAliveStream)
			{
				let controller = LiveController()
				event.respondWith(toNDJSON(controller.stream)).catch(() => { })
				
				let listener = () => { controller.push({done: "accepted"}) ; controller.finish() }
				let declinedListener = controller.finish
				
				controller.push({type: "challenge", challenge: createChallenge({color, rated, clock, from, to, listener, declinedListener})})
				return
			}
			else
			{
				event.respondWith(new Response(JSON.stringify({type: "challenge", challenge: createChallenge({color, rated, clock, from, to})}), {headers: {"Content-Type": "application/json"}})).catch(() => { })
				return
			}
		}
	}
	
	event.respondWith(new Response("POST not allowed", {status: 405})).catch(() => { })
}

let handle = async (event, connection) =>
{
	let error = (message, status = 400) => event.respondWith(new Response(JSON.stringify({error: message}), {status, headers: {"Content-Type": "application/json"}})).catch(() => { })
	let ok = () => event.respondWith(new Response(`{"ok": true}`, {headers: {"Content-Type": "application/json"}})).catch(() => { })
	
	let {request} = event
	let username = request.headers.get("X-Millichess-Username")
	if (!username)
	{
		let authorization = request.headers.get("Authorization")
		if (authorization)
			username =
				removePrefix(authorization, "Username ") ??
				removePrefix(authorization, "Bearer Username ")
	}
	
	if (/[^a-zA-Z0-9]/.test(username))
	{
		error("The given username is invalid.")
		return
	}
	
	if (username) username = username.toLowerCase()
	
	if (request.method === "GET") handleGET(username, event, connection, error, ok)
	else if (request.method === "POST") handlePOST(username, event, connection, error, ok)
	else event.respondWith(new Response("method not allowed", {status: 405})).catch(() => { })
}

let handleConnection = async connection =>
{
	for await (let event of Deno.serveHttp(connection))
		handle(event, connection).catch(error => console.error(error))
}

for await (let connection of Deno.listen({port: 8018}))
	handleConnection(connection).catch(error => console.error(error))
