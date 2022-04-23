import {origin} from "./args.js"
import {nextRandom} from "./utils.js"

let players = new Map()

let perf =
{
	"games": 0,
	"rating": 1500,
	"rd": 100,
	"prog": 0,
	"prov": true,
}

export let createPlayer = (username, hostname, ephemeral) =>
{
	let json =
	{
		username,
		id: username,
		online: true,
		perfs:
		{
			chess960: perf,
			atomic: perf,
			racingKings: perf,
			ultraBullet: perf,
			blitz: perf,
			kingOfTheHill: perf,
			bullet: perf,
			correspondence: perf,
			horde: perf,
			puzzle: perf,
			classical: perf,
			rapid: perf,
			storm: perf,
		},
		createdAt: Date.now(),
		disabled: false,
		tosViolation: false,
		profile:
		{
			country: "US",
			location: "-",
			bio: "Hello, world!",
			firstName: username,
			lastName: "",
			fideRating: 1500,
			uscfRating: 1500,
			ecfRating: 1500,
			links: "",
		},
		get seenAt() { return Date.now() },
		patron: false,
		verified: false,
		playTime:
		{
			total: 0,
			tv: 0,
		},
		title: "BOT",
		url: `${origin}/@/${username}`,
		playing: null,
		completionRate: 100,
		count:
		{
			all: 0, rated: 0, ai: 0, draw: 0, drawH: 0, loss: 0, lossH: 0,
			win: 0, winH: 0, bookmark: 0, playing: 0, import: 0, me: 0,
		},
		streaming: false,
		followable: false,
		following: false,
		blocking: false,
		followsYou: false,
	}
	
	let countdown = setTimeout(() => players.delete(username), 30000)
	let keep = 0
	
	let player =
	{
		toJSON: () => json,
		username,
		hostname,
		refresh: () =>
		{
			if (countdown)
			{
				clearTimeout(countdown)
				countdown = setTimeout(() => players.delete(username), 30000)
			}
		},
		keep: () =>
		{
			keep++
			if (countdown) clearTimeout(countdown), countdown = null
		},
		drop: () =>
		{
			keep--
			if (keep === 0) countdown = setTimeout(() => players.delete(username), 30000)
		},
	}
	
	if (!ephemeral) players.set(username, player)
	return player
}

export let getPlayer = (username, hostname) =>
{
	if (!username)
	{
		username = "someone" + nextRandom()
		return createPlayer(username, hostname, true)
	}
	
	let player = players.get(username)
	if (player)
	{
		if (player.hostname !== hostname)
			return "This username is already in use."
		player.refresh()
	}
	else
	{
		player = createPlayer(username, hostname)
	}
	
	return player
}

export let getPlayerWithoutRefreshing = username => players.get(username)

export let getPlayers = () => [...players.values()]
