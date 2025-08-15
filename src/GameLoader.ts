import { Assets, Container, Graphics } from "pixi.js";

export class GameLoader extends Container {
  private symbols = [
    { alias: "cherry", src: "/assets/cherry-105141_1280.png" },
    { alias: "bell", src: "/assets/bell-37634_1280.png" },
    { alias: "lemon", src: "/assets/lemon-25244_1280.png" },
    { alias: "orange", src: "/assets/orange-439383_1280.png" },
    { alias: "star", src: "/assets/star-297563_1280.png" },
    { alias: "seven", src: "/assets/7-blue-1293839_1280.png" }
  ];

  private progressBarBg: Graphics;
  private progressBarFill: Graphics;
  private progress: number = 0;
  private progressWidth = 300;
  private progressHeight = 30;

  constructor(onComplete: () => void) {
    super();

    this.progressBarBg = new Graphics()
      .roundRect(0, 0, this.progressWidth, this.progressHeight, 5)
      .fill({ color: 0x333333 });

    this.progressBarFill = new Graphics()
      .roundRect(0, 0, 0, this.progressHeight, 5)
      .fill({ color: 0x00ff00 });

    const centerX = 300 - this.progressWidth / 2;
    const centerY = 300 - this.progressHeight / 2;

    this.progressBarBg.position.set(centerX, centerY);
    this.progressBarFill.position.set(centerX, centerY);

    this.addChild(this.progressBarBg, this.progressBarFill);

    this.loadAssets()
      .then(() => {
        let elapsed = 0;
        const duration = 1000;
        const interval = 16;

        const timer = setInterval(() => {
          elapsed += interval;
          this.progress = Math.min(elapsed / duration, 1);
          this.updateProgressBar();

          if (this.progress >= 1) {
            clearInterval(timer);
            console.log("Assets loaded successfully");
            onComplete();
          }
        }, interval);
      })
      .catch(err => {
        console.error("Error loading assets:", err);
      });
  }

  private updateProgressBar() {
    this.progressBarFill.clear();
    this.progressBarFill
      .roundRect(0, 0, this.progressWidth * this.progress, this.progressHeight, 5)
      .fill({ color: 0x00ff00 });
  }

  private async loadAssets() {
    try {
      this.symbols.forEach(symbol => {
        Assets.add(symbol);
      });
      await Assets.load(this.symbols.map(symbol => symbol.alias));
      console.log("All assets loaded");
    } catch (err) {
      console.error("Error loading assets:", err);
    }
  }
}
