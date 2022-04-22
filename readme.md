millichess
---

[Lichess API]: <https://lichess.org/api>
[Dummyette]: <https://github.com/zamfofex/dummyette>

**millichess** is a simplistic implementation of part of the [Lichess API] written in JavaScript. It can be useful for people wanting to test their bots without having to run them against Lichess itself, and also don’t want to run their own Lichess instance.

It intentionally diverges from the Lichess API in some ways, and doesn’t implement all of the API.

In particular, it doesn’t keep track of accounts, so usage is ephemeral. A username can be specified in the `Authorization` header (instead of the OAuth2 token), and then that username is reserved for that IP address for a few minutes. The player can then accept and make challenges.

For now, the only way to interact with millichess is through the bot API, but the plan is to allow people to directly interact with it through a web interface to test bots more easily.

It diverges from how the Lichess APIs in a variety of ways, and the reason can vary:

- It might be a bug.
- Some behavior is out of scope.
- It diverges intentionally in some ways.
- Maybe it isn’t implemented yet.

The scope of the project is not completely well defined yet, but as it matures, more information will hopefully be added to help differentiate those cases. Meanwhile, thoughts and suggestions about the current behavior are welcome! When in doubt, feel free to report it as a bug.

The project is in a very early stage, but it is enough to allow my bot [Dummyette] to run with very little modifications, and hopefully soon without any modifications.

license
---

[0BSD © zamfofex](license.md)
