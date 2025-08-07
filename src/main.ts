import { Application } from "pixi.js";
import { SlotMachine } from "./slotMachine";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({
    backgroundColor: 0x222222,
    width: 600,
    height: 600
  });
  const container = document.getElementById("pixi-container");
  if (container) {
    container.appendChild(app.canvas);
  } else {
    console.error("Container #pixi-container not found");
  }

  const slot = new SlotMachine(app);
  slot.start();
})();
