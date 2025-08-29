import { Application } from "pixi.js";
import { SlotMachine } from "./slotMachine";
import { initDevtools } from "@pixi/devtools";
import Handlebars from "handlebars";
import { getBetTemplate, getMenuTemplate } from "./templates";
import { menuData } from "./constants";
import { pixiConfig } from "./config";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init(pixiConfig);
  // Initialize devtools
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

  // Create SlotMachine instance and pass templates and data
  const slot = new SlotMachine(app, menuCompiled, betCompiled, menuData);
  slot.start();
})();
