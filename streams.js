let encoder = new TextEncoder()

let toBrowserStream = stream =>
	new ReadableStream(
	{
		start: async controller =>
		{
			for await (let value of stream)
			{
				let json = JSON.stringify(value) + "\n"
				let bytes = encoder.encode(json)
				controller.enqueue(bytes)
			}
			controller.close()
		}
	})

export let toNDJSON = stream => new Response(toBrowserStream(stream), {headers: {"Content-Type": "application/x-ndjson"}})
