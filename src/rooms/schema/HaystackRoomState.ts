import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string;
    @type("string") name: string;
    @type("string") color: string;
    @type("boolean") admin: boolean = false;
    @type("number") timeJoined: number;
    @type("boolean") roundDone: boolean = false;
    @type("number") score: number = 0;
    @type("boolean") inGame: boolean = false;

    @type("boolean") disconnectedPreviously: boolean = false;
    @type("boolean") disconnectedCurrently: boolean = false;

    // hold data from last COMPLETED round
    @type("number") lastGuessLat: number;
    @type("number") lastGuessLng: number;
    @type("number") lastTimeNeeded: number;
    @type("number") lastDistance: number;
    @type("number") lastScore: number;
}

export class Target extends Schema {
    @type("string") name: string;
    @type("number") lat: number;
    @type("number") lng: number;
}

export class HaystackRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type("boolean") gameActive: boolean;
    @type("boolean") roundActive: boolean;
    @type("boolean") guessingActive: boolean;

    @type("number") currentRoundCounter = 0;

    // settings
    @type("number") settingRounds = 4;
    // TODO some other data type to constrain this to one of the fixed values?
    @type("string") settingLocationSet = "C_WW";
    @type("number") settingTimeLimit = 30;

    // data bound to CURRENT round
    @type("string") currentTarget: string;

    // data bound to LAST COMPLETED round
    @type("number") lastTargetLat: number;
    @type("number") lastTargetLng: number;

    @type({ map: Target }) targetsAskedInGame = new MapSchema<Target>();
    @type({ map: Target }) targetsAskedInRoom = new MapSchema<Target>();
}