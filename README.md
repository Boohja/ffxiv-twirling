# FFXIV Twirling

An experimental tool helping me to learn FF14 rotations outside of the actual game, simply in the browser.

This tool does not give a flying moogle for anything like cooldowns, spell/skill times, (o)GCD or anything like that. It is simply meant for practicing the order of actions in a rotation - especially if you are not too familiar with your keybinds yet.

(I changed my hotbars and keybinds completely so I programmed this to help my muscle memory to adjust).


## Developing

There is not much to it, the usual `npm` stuff, `npm run dev -- --open` for local svelte testing.

### Updating Job Data

In the beginning I didn't want to bother with databases, so I kept game data in JSON files. 

When a game patch adds new skills, wait for a few days until [XIVAPI](https://xivapi.com/) has updated their data, then run `npm run update:jobs -- --test` to see if the implementation is still working. If it does, run `npm run update:jobs` to add missing skills/actions and their corresponding icons.
