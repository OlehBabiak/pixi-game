import { Application } from "pixi.js";
import { SlotMachine } from "./slotMachine";
import { initDevtools } from "@pixi/devtools";
import Handlebars from "handlebars";
import { getBetTemplate, getMenuTemplate } from "./templates";
import { menuData } from "./constants";
import { pixiConfig } from "./config";
// import { initCoinAnimation } from "./coinAnimation";

(async () => {
  const app = new Application();
  await app.init(pixiConfig);
  initDevtools({ app });
  const container = document.getElementById("pixi-container");
  if (container) {
    container.appendChild(app.canvas);
  } else {
    console.error("Container #pixi-container not found");
  }

  const menuTemplate = getMenuTemplate();
  const betTemplate = getBetTemplate();
  const menuCompiled = Handlebars.compile(menuTemplate);
  const betCompiled = Handlebars.compile(betTemplate);

  const slot = new SlotMachine(app, menuCompiled, betCompiled, menuData);
  slot.start();
})();
