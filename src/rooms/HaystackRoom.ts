import * as fs from 'fs';
import { Room, Client, ServerError } from "colyseus";
import { Dispatcher } from "@colyseus/command";
import { HaystackRoomState, Player, Target } from "./schema/HaystackRoomState";
import { OnJoinCommand } from "../commands/OnJoinCommand";
import { HaystackRound } from "../models/HaystackRound";
import { HaystackResult } from "../models/HaystackResult";
import { getDistance } from 'geolib';
import { MapSchema } from "@colyseus/schema";

export class HaystackRoom extends Room<HaystackRoomState> {
  dispatcher = new Dispatcher(this);
  currentRound: HaystackRound;
  targetDataSet: any;

  // When room is initialized
  onCreate (options: any) {
    this.setState(new HaystackRoomState());
    this.setPrivate(true);

    this.onMessage("settings/update", (client, message) => {
      // check if starting user is an admin
      if(this.state.players.get(client.id).admin === true) {
        // if yes, update the settings
        this.updateSettings(message);
      } else {
        // TODO reply with an error message?
        console.log("client is not an admin");
      }
    });

    // TODO put in Command => split up between start_game and start_round
    this.onMessage("game/start", (client, message) => {
      // check if starting user is an admin
      if(this.state.players.get(client.id).admin === true) {
        // if yes, start a new game
        this.startGame(message.settings);
      } else {
        // TODO reply with an error message?
        console.log("client is not an admin");
      }
    });

    this.onMessage("round/start", (client, message) => {
      // check if starting user is an admin
      if(this.state.players.get(client.id).admin === true) {
        // if yes, start a new round
        this.startRound();
      } else {
        // TODO reply with an error message?
        console.log("client is not an admin");
      }
    });

    // TODO put in command
    this.onMessage("guess/submit", (client, message) => {
      this.onGuess(client, message);
    });

    this.onMessage("scores/send", (client, message) => {
      console.log("received scores/send");
      // check if starting user is an admin
      if(this.state.players.get(client.id).admin === true) {
        // if yes, broadcast the message to all clients
        this.showScores();
      } else {
        // TODO reply with an error message?
        console.log("client is not an admin");
      }
    });

    this.onMessage("round/finish", (client, message) => {
      // check if starting user is an admin
      if(this.state.players.get(client.id).admin === true) {
        // if yes, finish the round
        this.finishRound();
      } else {
        // TODO reply with an error message?
        console.log("client is not an admin");
      }
    });

    this.onMessage("game/cancel", (client, message) => {
      // check if starting user is an admin
      if(this.state.players.get(client.id).admin === true) {
        // if yes, cancel the game
        this.cancelGame();
      } else {
        // TODO reply with an error message?
        console.log("client is not an admin");
      }
    });
  }

  // Authorize client based on provided options before WebSocket handshake is complete
  onAuth (client: Client, options: any, request: any): boolean {
    // verify that username is not taken yet
    this.state.players.forEach((player: Player) => {
      if(player.name === options.playerName) {
        throw new ServerError(400, "usernameTaken");
      }
    });

    return true;
  }

  // When a client successfully joins the room
  onJoin (client: Client, options: any) {
    this.dispatcher.dispatch(new OnJoinCommand(), {
      clientId: client.sessionId,
      playerName: options.playerName
    });

    // broadcast new player to all clients
    this.broadcast("player/joined", { playerName: options.playerName }, { except: client })
  }

  // When a client leaves the room
  async onLeave(client: Client, consented: boolean) {
    try {
      /* TODO when implementing consented leaves, check what parts of this method have to be run and what parts don't
      if (consented) {
        throw new Error("consented leave");
      }
      */

      // if player was admin, make next non-admin player an admin (for each runs by time_joined)
      if (this.state.players.get(client.id).admin) {
        let newAdminFound = false;
        this.state.players.forEach((player: Player, id: string) => {
          if (!player.admin && !newAdminFound && !player.disconnectedCurrently) {
            newAdminFound = true;
            // note regarding one-admin-constraint: this call guarantees a single admin, no further action required
            this.state.players.get(id).admin = true;
            // get client object of new admin and send msg
            let client = this.clients.find(c => {
              return c.id === id
            })
            client.send("player/newAdmin", {})
          }
        });
      }

      // remove admin status from disconnected player
      this.state.players.get(client.id).admin = false;

      // set client to inactive
      this.state.players.get(client.id).inGame = false;
      this.state.players.get(client.id).disconnectedCurrently = true;
      this.state.players.get(client.id).disconnectedPreviously = true;

      // if last player left, end the current game
      let activePlayersRemaining = 0;
      this.state.players.forEach((player: Player) => {
        if(player.inGame) {
          activePlayersRemaining++;
        }
      });

      //if(activePlayersRemaining == 0) {
      //  this.finishGame();  // TODO do cancelGame instead?
      //}

      // if guessing is active and the player hadn't yet submitted, submit an empty guess
      if(this.state.guessingActive) {
        this.onGuess(client, { latLng: [0, 0] });
      }

      this.broadcastPatch();
      this.broadcast("player/left", {
        player: client.id,
        playerName: this.state.players.get(client.id).name
      });

      // allow disconnected client to reconnect into this room until 20 seconds
      await this.allowReconnection(client, 120);

      // client returned, set to active again
      this.state.players.get(client.id).disconnectedCurrently = false;
      this.state.players.get(client.id).timeJoined = this.clock.currentTime;

      // if there is currently no active admin, the rejoined client will be admin
      // TODO same code as in OnJoin, refactor and put into function
      let connectedAdmins = 0;
      this.state.players.forEach((player) => {
        // do not count the current player
        if(player.id !== client.id) {
          // only count existing admins
          if(player.admin) {
            // do not count disconnected players
            if(!player.disconnectedCurrently) {
              connectedAdmins++;
            }
          }
        }
      });
      if(connectedAdmins === 0) {
        // note regarding one-admin-constraint: this call guarantees a single admin,
        // no further action required
        this.state.players.get(client.id).admin = true;
      }

      this.broadcastPatch();

      // broadcast with "except" option did not work (everyone got the msg)
      // likely because client equality does not simply compare IDs and thus fails for
      // disconnected/rejoined client
      this.clients.forEach((c) => {
        if(c.id !== client.id) {  // don't send the msg to the new client itself
          c.send("player/rejoined", {
            player: client.id,
            playerName: this.state.players.get(client.id).name
          });
        }
      });
    } catch (e) {
      console.log("Removing client", client)
      console.log(e)
      // time expired, removing the client
      this.state.players.delete(client.id);
    }
  }

  // Cleanup callback, called after there are no more clients in the room
  onDispose() {
    this.dispatcher.stop();
  }

  readDataSet(locationSetName: string): any {
    try {
      let data;

      switch(locationSetName) {
        case 'C_WW':
          data = fs.readFileSync('./data/cities_ww.json', 'utf8');
          break;
        case 'C_EU':
          data = fs.readFileSync('./data/cities_eu.json', 'utf8');
          break;
        case 'S_EU':
          data = fs.readFileSync('./data/stadiums_eu.json', 'utf8');
          break;
        case 'S_DE':
          data = fs.readFileSync('./data/stadiums_de.json', 'utf8');
          break;
        default:
          data = fs.readFileSync('./data/cities_ww.json', 'utf8');
      }

      // parse JSON string to JSON object
      return JSON.parse(data);
    } catch (err) {
      console.log(`Error reading file from disk: ${err}`);
    }
  }

  updateSettings(settingsInput: any) {
    // rounds
    if(settingsInput.settings.rounds && settingsInput.settings.rounds > 0 &&
        settingsInput.settings.rounds <= 20) {
      this.state.settingRounds = Number(settingsInput.settings.rounds);
    }

    // location set
    if(settingsInput.settings.locationSet) {
      // TODO better way to validate that it's one of the available sets? Where/how to
      //  store available sets?
      let availableSets = ['C_WW', 'C_EU', 'S_EU', 'S_DE']
      if(availableSets.indexOf(settingsInput.settings.locationSet) > -1) {
        this.state.settingLocationSet = settingsInput.settings.locationSet
      }
    }

    // time limit
    if(settingsInput.settings.timeLimit && settingsInput.settings.timeLimit >= 5 &&
        settingsInput.settings.timeLimit <= 90) {
      this.state.settingTimeLimit = Number(settingsInput.settings.timeLimit);
    }

    // fetch settings from state
    let settings = {
      rounds: this.state.settingRounds,
      locationSet: this.state.settingLocationSet,
      timeLimit: this.state.settingTimeLimit
    };

    // send updated settings to all clients
    this.broadcast("settings/updated", { settings });
  }

  startGame(settings: any) {
    this.state.gameActive = true;

    this.state.settingRounds = Number(settings.rounds);
    this.state.settingLocationSet = settings.locationSet;
    this.state.settingTimeLimit = Number(settings.timeLimit || 30);

    // load data set
    this.targetDataSet = this.readDataSet(settings.locationSet);

    // set all players as inGame = true
    this.state.players.forEach((player: Player, id: string) => {
      if(!player.disconnectedCurrently) {
        player.inGame = true;
        player.score = 0;
      }
    });
    this.broadcastPatch();

    this.prepareRound();
  }

  prepareRound() {
    let roundsRemaining = this.state.settingRounds - this.state.currentRoundCounter;

    if(this.state.gameActive && roundsRemaining > 0) {
      // TODO also check that the previous round has been finished before starting a new one?
      this.state.roundActive = true;
      this.state.currentRoundCounter++;
      this.currentRound = new HaystackRound();

      // for all players
      this.state.players.forEach((player: Player, id: string) => {
        // add them to the results set
        this.currentRound.results.set(id, new HaystackResult(id));

        // reset their 'done' state
        player.roundDone = false;
      });

      // get a random city
      let nextTarget = this.getNextTarget();
      this.currentRound.targetLat = nextTarget.lat;
      this.currentRound.targetLng = nextTarget.lng;
      this.currentRound.targetName = nextTarget.name;

      this.broadcastPatch();

      console.log("round/prepared")
      this.broadcast("round/prepared", {});
    } else {
      console.log("did not send round/prepared", this.state.gameActive, roundsRemaining)
    }
  }

  startRound() {
    if(this.state.gameActive) {
      this.state.guessingActive = true;

      // publish target to state
      this.state.currentTarget = this.currentRound.targetName;

      // start timer
      this.clock.start()

      console.log("Setting up timer", this.state.settingTimeLimit * 1000)
      this.clock.setTimeout(() => {
        this.clock.clear()
        this.completeRound()
      }, this.state.settingTimeLimit * 1000);

      this.broadcastPatch();

      this.broadcast("round/started", {});

      // for any players that are not in the game, reset last round's info (mostly relevant for players that left)
      this.state.players.forEach((player) => {
        player.lastGuessLat = 0;
        player.lastGuessLng = 0;
        player.lastDistance = undefined;
        player.lastScore = 0;
      });
    } else {
      console.error("no game running, why are you starting a round?");
    }
  }

  completeRound() {
    // clear clock
    this.clock.clear()

    // add scores to players
    this.state.players.forEach((player: Player, id: string) => {
      if(player.inGame && !player.disconnectedCurrently) {
        // publish guessed coordinates to state
        player.lastGuessLat = this.currentRound.results.get(id).lat;
        player.lastGuessLng = this.currentRound.results.get(id).lng;
        player.lastTimeNeeded = this.currentRound.results.get(id).timeNeeded;

        // calculate distance and write to state
        player.lastDistance =
            this.currentRound.results.get(id).lat && this.currentRound.results.get(id).lng ?
                this.getDistance(this.currentRound.results.get(id)) : undefined

        // calculate score and write to state
        player.lastScore =
            player.lastDistance ?
                this.calculatePoints(player.lastDistance) : 0

        // update total score
        player.score += player.lastScore;
      }
    });

    // publish target coordinates
    this.state.lastTargetLat = this.currentRound.targetLat;
    this.state.lastTargetLng = this.currentRound.targetLng;

    this.broadcastPatch();

    this.broadcast("round/completed", { });

    this.state.guessingActive = false;
  }

  finishRound() {
    // TODO
    // reset currentRound here?
    // or re-initialize in startRound?

    this.state.roundActive = false;

    let roundsRemaining = this.state.settingRounds - this.state.currentRoundCounter;

    if(roundsRemaining == 0) {  // if this was the last round of the game
      this.state.gameActive = false;

      this.state.currentRoundCounter = 0;

      // set all players as inGame = false
      this.state.players.forEach((player: Player, id: string) => {
        player.inGame = false;
      });

      // reset target map
      this.state.targetsAskedInGame = new MapSchema<Target>();

      this.broadcastPatch();
      this.broadcast("game/completed");
    } else {
      // otherwise, prepare the next round
      this.prepareRound();
    }
  }

  showScores() {
    this.broadcast("scores/sent");
  }

  cancelGame() {
    // reset game state
    this.state.guessingActive = false;
    this.state.roundActive = false;
    this.state.gameActive = false;
    this.state.currentRoundCounter = 0;

    // reset players' state
    this.state.players.forEach((player: Player) => {
      player.inGame = false;
      player.lastGuessLat = 0;
      player.lastGuessLng = 0;
      player.lastScore = 0;
      player.lastDistance = undefined;
      player.score = 0;
      player.roundDone = false;
    });

    // reset target map
    this.state.targetsAskedInGame = new MapSchema<Target>();

    this.broadcastPatch();

    this.broadcast("game/cancelled", { });
  }

  // TODO put in HaystackResult?
  calculatePoints(distance: number) {
    let sf = 1

    // adjust scaling factor based on location set
    switch(this.state.settingLocationSet) {
      case 'C_EU':
      case 'S_EU':
        sf = 2.5;
        break;
      case 'S_DE':
        sf = 5;
        break;
      default:
        sf = 1;
    }

    return Math.round(Math.E ** (-sf * (sf * distance) ** 2 / 600000) * 1000);
  }

  getDistance(result: HaystackResult) {
    //console.log(JSON.parse(JSON.stringify(result)))
    return getDistance(
        { lat: result.lat, lng: result.lng },
        { lat: this.currentRound.targetLat, lng: this.currentRound.targetLng }
    )/1000;
  }

  onGuess(client: Client, message: any) {
    // update player's status and guess coordinates
    this.state.players.get(client.id).roundDone = true;
    this.currentRound.results.get(client.id).lat = message.latLng.lat;
    this.currentRound.results.get(client.id).lng = message.latLng.lng;
    this.currentRound.results.get(client.id).timeNeeded = this.clock.elapsedTime;
    this.broadcastPatch();

    // notify all users except the sender
    this.broadcast("player/finished", { player: client.id });

    // when all players are done, end the round and send the result to all players
    // TODO separate function
    let allDone = true;
    this.state.players.forEach((player: Player, id: string) => {
      if(player.inGame && !player.roundDone && !player.disconnectedCurrently) {
        allDone = false;
      }
    });

    if(allDone) {
      this.completeRound();
    }

    // TODO put this in finishGame and finishRound?
  }

  getClient(clientId: string): Client {
    this.clients.forEach((c) => {
      if(c.sessionId === clientId) {
        return c;
      }
    });

    return;
  }

  getNextTarget(): Target {
    // get random target
    let nextTarget = this.getRandomTarget();

    // TODO
    // while target has already been asked in game or in room, get a new one
    // TODO implement solution to prevent reaching the end of the list

    this.state.targetsAskedInGame.set(nextTarget.name, nextTarget);
    this.state.targetsAskedInRoom.set(nextTarget.name, nextTarget);

    return nextTarget;
  }

  getRandomTarget(): Target {
    // TODO implement access to some DB or other data structure

    let randomCity = this.targetDataSet[Math.floor(Math.random() * this.targetDataSet.length)];
    return new Target({ name: randomCity.name, lat: randomCity.lat, lng: randomCity.lng });
  }
}
