let toInteger = value =>
{
	value = Number(value)
	if (!Number.isInteger(value)) return
	return value
}

let schema =
{
	port: value =>
	{
		value = toInteger(value)
		if (value === undefined) return
		if (value < 0) return
		if (value > 10000) return
		return value
	},
	hostname: value => value,
	origin: value =>
	{
		try { value = new URL(value) }
		catch { return }
		if (!value.pathname.endsWith("/"))
			value.pathname += "/"
		return new URL(".", value).href.slice(0, -1)
	},
	key: value => value,
	cert: value => value,
}

let args = {}

for (let arg of Deno.args)
{
	if (!arg.startsWith("--"))
	{
		console.error(`A non-option argument is not allowed: '${arg}'`)
		Deno.exit(1)
	}
	arg = arg.slice(2)
	
	let equals = arg.indexOf("=")
	if (equals === -1)
	{
		console.error(`Option '${arg}' cannot be specified without a value.`)
		console.error("Hint: Specify a value with an equal sign.")
		console.error(`E.g.: '--${arg}=...'`)
		Deno.exit(1)
	}
	
	let name = arg.slice(0, equals)
	let value = arg.slice(equals + 1)
	
	if (!(name in schema))
	{
		console.error(`Option '${name}' is unknown.`)
		Deno.exit(1)
	}
	
	if (name in args)
	{
		console.error(`Duplicate option '${name}'.`)
		Deno.exit(1)
	}
	
	value = schema[name](value)
	
	if (value === undefined)
	{
		console.error(`Wrong value specified for option '${name}'.`)
		Deno.exit(1)
	}
	
	args[name] = value
}

export let {
	port = 8018,
	hostname = "localhost",
	origin = "https://lichess.org",
	key,
	cert,
} = args
