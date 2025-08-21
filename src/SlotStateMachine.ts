export enum SlotState {
  LOADING = "LOADING",
  IDLE = "IDLE",
  SPINNING = "SPINNING",
  STOPPING = "STOPPING",
  SHOW_WIN = "SHOW_WIN",
  FREE_SPIN = "FREE_SPIN"
}
export interface Observer {
  update(newState: SlotState, oldState: SlotState): void;
}

// Subject
interface Subject {
  subscribe(observer: Observer): void;
  unsubscribe(observer: Observer): void;
  notify(newState: SlotState, oldState: SlotState): void;
}

export class SlotStateMachine implements Subject {
  private _state: SlotState = SlotState.LOADING;
  private observers: Observer[] = [];

  public get state() {
    return this._state;
  }

  public setState(newState: SlotState) {
    if (this._state === newState) return;
    const oldState = this._state;
    this._state = newState;
    console.log(`FSM: ${oldState} → ${newState}`);
    this.notify(newState, oldState);
  }

  subscribe(observer: Observer): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(newState: SlotState, oldState: SlotState): void {
    for (const listener of this.observers) {
      listener.update(newState, oldState);
    }
  }
}
