export let pages = new Map()

pages.set("/", {type: "text/html", text: await Deno.readTextFile(new URL("index.html", import.meta.url))})
pages.set("/robots.txt", {type: "text/plain", text: "User-agent: *\nAllow: /\nDisallow: /\n"})

let recurse = async path =>
{
	for await (let {isDirectory, name} of Deno.readDir(new URL(path, import.meta.url)))
	{
		let pathname = path + "/" + name
		
		if (isDirectory)
			await recurse(pathname)
		else if (name.endsWith(".js"))
			pages.set("/" + pathname, {type: "text/javascript", text: await Deno.readTextFile(new URL(pathname, import.meta.url))})
	}
}

await recurse("dummyette")

export let gamePage = await Deno.readTextFile(new URL("game.html", import.meta.url))
