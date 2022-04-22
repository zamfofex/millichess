import {LiveController} from "./dummyette/streams.js"

export let toSpeed = clock =>
{
	let speed = "unlimited"
	if (clock)
	{
		let {time, increment} = clock
		let t = time + increment * 40
		
		speed = "ultraBullet"
		if (t >= 30) speed = "bullet"
		if (t >= 180) speed = "blitz"
		if (t >= 480) speed = "rapid"
		if (t >= 1500) speed = "classical"
	}
	
	return speed
}

export let toEventPlayer = player =>
{
	let {username} = player
	return {id: username, name: username, title: "BOT", rating: 1500, provisional: true}
}

let i = 0
let nextIndex = () =>
{
	let index = i++
	i %= 0x100
	return index.toString(0x10).padStart(2, "0")
}
export let nextRandom = () =>
{
	let random = Math.floor(Math.random() * 8**20)
	return random.toString(0x10).padStart(10, "0") + nextIndex()
}

export let removePrefix = (string, prefix) =>
{
	if (string.startsWith(prefix))
		return string.slice(prefix.length)
}

export let globalController = LiveController()
export let globalEvents = globalController.stream
