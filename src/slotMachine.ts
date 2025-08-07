import {
  Application,
  Container,
  FillGradient,
  Graphics,
  Text,
  TextStyle,
  TextStyleAlign
} from "pixi.js";

interface Reel {
  container: Container;
  symbols: Text[];
  position: number;
  speed: number;
  targetStop: number;
  spinning: boolean;
  stopping?: boolean;
}

type GameState = "idle" | "spinning" | "stopping" | "evaluating";

export class SlotMachine extends Container {
  private app: Application;
  private reels: Reel[] = [];
  private symbols: string[] = ["🍒", "🔔", "🍋", "🍊", "⭐️", "7️⃣"];
  private readonly reelWidth: number = 150;
  private readonly symbolSize: number = 100;
  private readonly reelHeight: number = 3;
  private readonly reelCount: number = 3;
  private stoppedReels: number = 0;
  private state: GameState = "idle";

  private setState(newState: GameState) {
    console.log(`FSM: ${this.state} → ${newState}`);
    this.state = newState;
  }

  constructor(app: Application) {
    super();
    this.app = app;
  }

  start() {
    this.createReels();
    this.addSpinButton();
  }

  createReels() {
    const spacing = 40;
    const baseX =
      (this.app.screen.width - (this.reelCount * this.reelWidth + (this.reelCount - 1) * spacing)) /
      2;

    for (let i = 0; i < this.reelCount; i++) {
      const container = new Container();
      container.x = baseX + i * (this.reelWidth + spacing);
      container.y = 100;
      this.app.stage.addChild(container);

      // Рамка
      const frame = new Graphics()
        .rect(0, this.symbolSize / 2, this.reelWidth, this.symbolSize * this.reelHeight)
        .stroke({ width: 4, color: 0xffd700 });

      frame.x = container.x;
      frame.y = container.y;
      this.app.stage.addChild(frame);

      // Маска
      const maskShape = new Graphics()
        .rect(0, this.symbolSize / 2, this.reelWidth, this.symbolSize * this.reelHeight)
        .fill(0xffffff);

      maskShape.x = container.x;
      maskShape.y = container.y;
      this.app.stage.addChild(maskShape);
      container.mask = maskShape;

      const reel: Reel = {
        container,
        symbols: [],
        position: 0,
        speed: 0,
        targetStop: 0,
        spinning: false
      };

      for (let j = 0; j < this.reelHeight + 4; j++) {
        const style = new TextStyle({
          fontFamily: "Arial",
          fontSize: 64,
          fill: 0xffffff,
          align: "center" as TextStyleAlign
        });

        const symbol = new Text({
          text: this.randomSymbol(),
          style: style
        });
        symbol.anchor.set(0.5);
        symbol.x = this.reelWidth / 2;
        symbol.y = j * this.symbolSize;
        container.addChild(symbol);
        reel.symbols.push(symbol);
      }

      this.reels.push(reel);
    }

    this.app.ticker.add(delta => this.updateReels(delta.deltaMS));
  }

  addSpinButton() {
    const container = new Container();

    // Background
    const background = new Graphics().fill(0x3333ff).roundRect(0, 0, 200, 60, 10).fill();

    const gradient = new FillGradient({
      type: "linear",
      colorStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#ff9900" }
      ]
    });

    const style = new TextStyle({
      fontFamily: "Arial",
      fontSize: 42,
      fill: gradient,
      stroke: {
        color: 0x4a1850,
        width: 5
      },
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 6,
        alpha: 0.5,
        angle: Math.PI / 4
      }
    });

    const button = new Text({
      text: "SPIN",
      style: style
    });
    button.anchor.set(0.5);
    button.x = 100;
    button.y = 30;

    container.interactive = true;
    container.eventMode = "dynamic";
    container.cursor = "pointer";
    container.x = this.app.screen.width / 2;
    container.y = this.app.screen.height - 80;
    container.pivot.set(100, 30);

    container.on("pointerdown", () => this.spinReels());

    container.addChild(background, button);
    this.app.stage.addChild(container);
  }

  spinReels() {
    if (this.state !== "idle") return;
    this.setState("spinning");
    this.stoppedReels = 0;

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      reel.speed = 0.5 + i * 0.15;
      reel.spinning = true;

      setTimeout(
        () => {
          reel.targetStop = Math.floor(Math.random() * this.symbols.length);
          reel.stopping = true;

          if (i === this.reels.length - 1) {
            this.setState("stopping");
          }
        },
        1000 + i * 600
      );
    }
  }

  checkWin() {
    let winAmount = 0;
    const winningLines: string[] = [];

    const payLines = {
      top: this.reels.map(reel => reel.symbols[1].text),
      middle: this.reels.map(reel => reel.symbols[2].text),
      bottom: this.reels.map(reel => reel.symbols[3].text),
      diagonalDown: this.reels.map((reel, i) => reel.symbols[1 + i]?.text),
      diagonalUp: this.reels.map((reel, i) => reel.symbols[3 - i]?.text)
    };

    Object.entries(payLines).forEach(([payLine, symbols]) => {
      const allEqual = symbols.every(sym => sym === symbols[0]);
      if (!allEqual) return;

      switch (payLine) {
        case "top":
          winAmount += 100;
          winningLines.push("Верхня лінія");
          break;
        case "middle":
          winAmount += 300;
          winningLines.push("Середня лінія");
          break;
        case "bottom":
          winAmount += 100;
          winningLines.push("Нижня лінія");
          break;
        case "diagonalDown":
          winAmount += 50;
          winningLines.push("Діагональ ↘");
          break;
        case "diagonalUp":
          winAmount += 50;
          winningLines.push("Діагональ ↗");
          break;
      }
    });

    const messageText =
      winAmount > 0 ? `WIN ${winAmount}$!\n(${winningLines.join(", ")})` : "TRY AGAIN";

    const message = new Text({
      text: messageText,
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 42,
        fill: winAmount > 0 ? 0x00ff00 : 0xff5555,
        align: "center" as TextStyleAlign
      })
    });

    message.anchor.set(0.5);
    message.x = this.app.screen.width / 2;
    message.y = 40;
    this.app.stage.addChild(message);

    setTimeout(() => {
      this.app.stage.removeChild(message);
      this.setState("idle");
    }, 1500);
  }

  updateReels(deltaMS: number) {
    const delta = deltaMS / 16.6667;

    for (const reel of this.reels) {
      if (!reel.spinning) continue;

      reel.position += reel.speed * delta;
      if (reel.position >= 1) {
        reel.position = 0;

        const first = reel.symbols.shift() || new Text("");
        first.x = this.reelWidth / 2;
        first.text = this.randomSymbol();
        first.y = reel.symbols[reel.symbols.length - 1].y + this.symbolSize;
        reel.symbols.push(first);
      }

      for (let i = 0; i < reel.symbols.length; i++) {
        reel.symbols[i].y = i * this.symbolSize - reel.position * this.symbolSize;
      }

      if (reel.stopping && reel.speed > 0.05) {
        reel.speed *= 0.95;
      } else if (reel.stopping) {
        reel.spinning = false;
        reel.stopping = false;
        reel.speed = 0;

        reel.position = 0;
        for (let i = 0; i < reel.symbols.length; i++) {
          reel.symbols[i].y = i * this.symbolSize;
        }

        this.stoppedReels++;
        if (this.stoppedReels === this.reels.length) {
          this.setState("evaluating");
          this.checkWin();
        }
      }
    }
  }

  randomSymbol() {
    const index = Math.floor(Math.random() * this.symbols.length);
    return this.symbols[index];
  }
}
