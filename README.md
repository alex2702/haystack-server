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

## License

MIT
