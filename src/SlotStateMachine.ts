export enum SlotState {
  LOADING = "LOADING",
  IDLE = "IDLE",
  SPINNING = "SPINNING",
  STOPPING = "STOPPING",
  SHOW_WIN = "SHOW_WIN",
  FREE_SPIN = "FREE_SPIN"
}

type StateChangeCallback = (newState: SlotState, oldState: SlotState) => void;

export class SlotStateMachine {
  private _state: SlotState = SlotState.LOADING;
  private listeners: StateChangeCallback[] = [];

  public get state() {
    return this._state;
  }

  public setState(newState: SlotState) {
    if (this._state === newState) return;
    const oldState = this._state;
    this._state = newState;
    console.log(`FSM: ${oldState} → ${newState}`);
    this.listeners.forEach(cb => cb(newState, oldState));
  }

  public onChange(callback: StateChangeCallback) {
    this.listeners.push(callback);
  }
}
