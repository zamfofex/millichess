let encoder = new TextEncoder()

let newline = encoder.encode("\n")

let toBrowserStream = stream =>
{
	let finished
	let interval
	let result = new ReadableStream(
	{
		start: async controller =>
		{
			interval = setInterval(() => controller.enqueue(newline), 500)
			for await (let value of stream)
			{
				if (finished) break
				let json = JSON.stringify(value) + "\n"
				let bytes = encoder.encode(json)
				controller.enqueue(bytes)
			}
			if (interval) clearInterval(interval)
			controller.close()
		},
		cancel: () =>
		{
			finished = true
			if (interval) clearInterval(interval)
			interval = null
		}
	})
	return result
}

export let toNDJSON = stream => new Response(toBrowserStream(stream), {headers: {"Content-Type": "application/x-ndjson"}})
