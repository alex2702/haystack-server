# Haystack Server

This is the backend part of Haystack, a multiplayer geography quiz game. 
It is implemented in TypeScript and runs with Node.js. 
Multiplayer functionality is offered by and implemented through the 
[Colyseus](http://docs.colyseus.io/) framework.

## Running the Project

```
npm install
npm start
```

## Project Structure

- `src/index.ts` is the main entry point. The room handler is registered here
  and [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor) is attached.
- `src/rooms/HaystackRoom.ts` implements the above-mentioned room handler for Haystack.
- `src/rooms/schema/HaystackRoomState.ts` is the schema that represents the room's state.
- `loadtest/example.ts` is scriptable client for the loadtest tool (see `npm run loadtest`).
- `package.json`:
    - `scripts`:
        - `npm start`: runs `ts-node-dev index.ts`
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
- `tsconfig.json`: TypeScript configuration file

## Datasets

Different location sets are available to play with.

### Data Source

All data has been from acquired from wikidata.org using their [Query Service](https://query.wikidata.org/).

The resulting CSV files are processed with some simple Python scripts to get rid of duplicates.
Furthermore, some restrictions apply (see below) to limit the difficulty.

### Available Sets

There are currently four datasets to choose from:

#### World Cities
- Population must be over 100.000.
- For Germany, Switzerland, and Austria, a maximum of 25 cities can be in the set.
- For other European countries, at most 10 cities are included.
- For all other countries, the limit is 2 cities.

#### European Cities
- Population must be over 100.000.
- For Germany, Switzerland, and Austria, a maximum of 25 cities can be in the set.
- For other European countries, at most 10 cities are included.

#### European Football Stadiums
- There must be a club from a large European league (about 20 countries + second and third vision of Germany) 
  playing in the stadium.

#### German Football Stadiums
- There must be a club from the top three divisions playing in the stadium.

## License

MIT
