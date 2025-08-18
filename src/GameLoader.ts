import { Assets, Container, Graphics } from "pixi.js";

export class GameLoader extends Container {
  private assets = [
    { alias: "cherry", src: "/assets/cherry-105141_1280.png" },
    { alias: "bell", src: "/assets/bell-37634_1280.png" },
    { alias: "lemon", src: "/assets/lemon-25244_1280.png" },
    { alias: "orange", src: "/assets/orange-439383_1280.png" },
    { alias: "star", src: "/assets/star-297563_1280.png" },
    { alias: "seven", src: "/assets/7-blue-1293839_1280.png" },
    { alias: "mainBG", src: "/assets/main_bg.png" },
    { alias: "secondaryBG", src: "/assets/secondary_bg.png" }
  ];

  private progressBarBg: Graphics;
  private progressBarFill: Graphics;
  private progressWidth = 300;
  private progressHeight = 30;

  constructor(onComplete: () => void) {
    super();

    // фон прогресбару
    this.progressBarBg = new Graphics()
      .roundRect(0, 0, this.progressWidth, this.progressHeight, 5)
      .fill({ color: 0x333333 });

    // зелена полоска (повна ширина, але scale.x = 0)
    this.progressBarFill = new Graphics()
      .roundRect(0, 0, this.progressWidth, this.progressHeight, 5)
      .fill({ color: 0x00ff00 });
    this.progressBarFill.scale.x = 0;

    const centerX = 300 - this.progressWidth / 2;
    const centerY = 300 - this.progressHeight / 2;

    this.progressBarBg.position.set(centerX, centerY);
    this.progressBarFill.position.set(centerX, centerY);

    this.addChild(this.progressBarBg, this.progressBarFill);

    this.loadAssets(onComplete);
  }

  private updateProgressBar(progress: number) {
    this.progressBarFill.scale.x = progress; // від 0 до 1
  }

  private async loadAssets(onComplete: () => void) {
    try {
      this.assets.forEach(asset => Assets.add(asset));

      await Assets.load(
        this.assets.map(a => a.alias),
        (progress: number) => {
          console.log(progress);
          this.updateProgressBar(progress);
        }
      );

      console.log("All assets loaded");
      onComplete();
    } catch (err) {
      console.error("Error loading assets:", err);
    }
  }
}
