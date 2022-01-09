import { Room, Client, ServerError } from "colyseus";
import { Dispatcher } from "@colyseus/command";

import { HaystackRoomState } from "./schema/HaystackRoomState";
import { OnJoinCommand } from "../commands/OnJoinCommand";

export class HaystackRoom extends Room<HaystackRoomState> {
  dispatcher = new Dispatcher(this);

  // When room is initialized
  onCreate (options: any) {
    this.setState(new HaystackRoomState());
    this.setPrivate(true);

    this.onMessage("settings/update", (client, message) => {

    });

    this.onMessage("game/start", (client, message) => {

    });

    this.onMessage("round/start", (client, message) => {

    });

    this.onMessage("guess/submit", (client, message) => {

    });

    this.onMessage("scores/send", (client, message) => {

    });

    this.onMessage("round/finish", (client, message) => {

    });

    this.onMessage("game/cancel", (client, message) => {

    });
  }

  // Authorize client based on provided options before WebSocket handshake is complete
  onAuth (client: Client, options: any, request: any): boolean {
    return true;
  }

  // When a client successfully joins the room
  onJoin (client: Client, options: any) {
    this.dispatcher.dispatch(new OnJoinCommand(), {
      clientId: client.sessionId
    });
  }

  // When a client leaves the room
  async onLeave(client: Client, consented: boolean) {

  }

  // Cleanup callback, called after there are no more clients in the room
  onDispose() {
    this.dispatcher.stop();
  }
}
