# Haystack Server

This is the backend part of Haystack, a multiplayer geography quiz game. 
It is implemented in TypeScript and runs with Node.js. 
Multiplayer functionality is offered by and implemented through the 
[Colyseus](http://docs.colyseus.io/) framework. Connection to the client 
([haystack-client](https://github.com/alex2702/haystack-client) and 
[haystack-client-react](https://github.com/alex2702/haystack-client-react)) is realized with Websockets. When running,
the server offers a monitoring interface at `/monitoring`.

A running version of the game can be found at [haystack.axm.li](https://haystack.axm.li/).

## Game Logic and Features

- Players can create rooms, others can join via link. The creating player is the room admin.
- The admin can make settings (number of rounds, time limit, location set).
- Multiple location sets are available: World Cities, European Citis, European Football Stadiums, 
  German Football Stadiums.
- In each round, the players are presented with a map and a place from the set. Players can then drop a pin at the
  location that they believe the place is in. Once all players are done (or the time is up), the round is over.
- After each round, scores are calculated and shown to the users.

### Future Ideas

##### Improved Score Calculation
- The scoring function is challenging because it can quickly offset the game's balance when it's not implemented in a 
  good way. 
- Idea: Calculate scores relative to the results of the other players. Sometimes none of the players get very close to
  the correct location. In this case, a "relative score" would still award some points to the closest player. However,
  this can cause big differences when all players are closely together (e.g. because everyone knows where some European
  capital is), which can get frustrating.
- The scoring function also needs to take into account the time that a player has taken to reply. This is also 
  implemented but could be improved.
- The scoring function needs a scaling factor depending on the maximum distance between targets. It is easier to 
  randomly guess a location when the set is restricted to Europe compared to the World. This is currently implemented
  as a hard-coded factor per location set. Ideally, it should be calculated automatically or stored in the database.
- The game could offer additional hints to players when requested. When a player has used a hint, that fact should be 
  reflected in the score.

##### More Datasets
- Tourist sights (Eiffel Tower, Empire State Building, ...).
- Geographic features (e.g. mountains or lakes).
- Trivia (e.g. where a given movie is set or where a historic event took place).
- Areas (harder because the correct answer is not a single precise location).

##### Database
- Datasets are currently stored in JSON files. Performance and maintainability could be improved by using a database. 
  Furthermore, subsets (e.g. cities of different continents) could be implemented much easier.
- A database would allow saving accounts, results, and so on (see below).

##### Improved Data Sourcing
- Getting the data for the above datasets is a manual process right now. In order to allow faster additions of new 
  datasets and regular updates, data should be sourced from Wikidata in a (semi-)automated way. Wikidata offers a 
  few [ways to access their data](https://www.wikidata.org/wiki/Wikidata:Tools/For_programmers).
- This process should take care of all the processing steps:
  - initial query
  - eliminating duplicates
  - enforcing constraints (e.g. only cities with population over 100.000)
  - inserting into application's database

##### Difficulty Levels
- Map with or without certain lines and markers (border, rivers).
- Provide hints (either fixed to everyone or on request to individual players).

##### Localization
- Translate the application in different languages.
- Allow each player to select the units being used.

##### Accounts & Scoreboard
- Save high scores.
- Allow users to create an account and sign in.
- Requires database (see above).

##### Single-Player Mode
- The game may be fun to play in single-player mode. Many current steps could be eliminated when playing with just one
  player (room creation, ...).

## Datasets

Different location sets are available to play with.

### Data Source

All data has been from acquired from wikidata.org using their [Query Service](https://query.wikidata.org/).

The resulting CSV files are processed with some simple Python scripts to get rid of duplicates.
Furthermore, some restrictions apply (see below) to limit the difficulty.

### Available Sets

There are currently four datasets to choose from:

##### World Cities
- Population must be over 100.000.
- For Germany, Switzerland, and Austria, a maximum of 25 cities can be in the set.
- For other European countries, at most 10 cities are included.
- For all other countries, the limit is 2 cities.

##### European Cities
- Population must be over 100.000.
- For Germany, Switzerland, and Austria, a maximum of 25 cities can be in the set.
- For other European countries, at most 10 cities are included.

##### European Football Stadiums
- There must be a club from a large European league (about 20 countries + second and third vision of Germany)
  playing in the stadium.

##### German Football Stadiums
- There must be a club from the top three divisions playing in the stadium.

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

## License

MIT
