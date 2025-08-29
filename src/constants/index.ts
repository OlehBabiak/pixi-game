import { MenuData } from "../types";

export const currentBet = 10;

export const menuData: MenuData = {
  items: [
    { name: "Info", action: "info" },
    { name: "Settings", action: "settings" },
    { name: "New Game", action: "new_game" }
  ]
};
