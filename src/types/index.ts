import { Container, Sprite } from "pixi.js";

export interface Reel {
  container: Container;
  symbols: Sprite[];
  position: number;
  speed: number;
  targetStop: number;
  spinning: boolean;
  stopping?: boolean;
}

export interface SymbolSprite extends Sprite {
  symbolKey: string;
}

export interface MenuItem {
  name: string;
  action: string;
}

export interface MenuData {
  items: MenuItem[];
}

export interface BetData {
  currentBet: number;
}
