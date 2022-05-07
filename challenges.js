import {toSpeed, toEventPlayer, nextRandom, globalController} from "./utils.js"
import {origin} from "./args.js"
import {createGame} from "./games.js"

let challenges = new Map()

export let createChallenge = ({color, rated, clock, variant = "standard", from, to, listener, declinedListener}) =>
{
	let fullID = nextRandom()
	let id = fullID.slice(0, 8)
	
	let timeControl = {type: "unlimited"}
	if (clock)
	{
		timeControl =
		{
			type: "clock",
			limit: clock.time,
			increment: clock.increment,
			show: `${Math.round(clock.time / 60)}+${clock.increment}`,
		}
	}
	
	let speed = toSpeed(clock)
	
	let json =
	{
		id,
		url: `${origin}/${id}`,
		color,
		direction: "out",
		timeControl,
		variant: {key: variant},
		challenger: toEventPlayer(from),
		destUser: toEventPlayer(to),
		rated,
		speed,
		status: "created",
		perf: {name: speed[0].toUpperCase() + speed.slice(1)},
	}
	
	globalController.push({target: to.username, value: {type: "challenge", challenge: {...json, direction: "in"}}})
	
	let challenge =
	{
		toJSON: () => json,
		accept: by =>
		{
			if (by.username !== to.username)
				return "You cannot accept this challenge."
			
			if (color === "random") color = Math.random() < 0.5 ? "white" : "black"
			
			let white
			let black
			if (color === "white")
				white = from,
				black = to
			else
				white = to,
				black = from
			
			createGame({fullID, rated, variant, clock, white, black})
			challenges.delete(id)
			
			if (listener) listener()
		},
		decline: by =>
		{
			if (by.username !== to.username)
				return "You cannot decline this challenge."
			challenges.delete(id)
			if (declinedListener) declinedListener()
		},
	}
	
	if (!listener) setTimeout(() => challenges.delete(id), 20000)
	
	challenges.set(id, challenge)
	return challenge
}

export let getChallenge = id => challenges.get(id)
