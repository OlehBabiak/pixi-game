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

enum SlotState {
  IDLE = "IDLE",
  SPINNING = "SPINNING",
  STOPPING = "STOPPING",
  SHOW_WIN = "SHOW_WIN",
  FREE_SPIN = "FREE_SPIN"
}

export class SlotMachine extends Container {
  private app: Application;
  private reels: Reel[] = [];
  private symbols: string[] = ["🍒", "🔔", "🍋", "🍊", "⭐️", "7️⃣"];
  private readonly reelWidth: number = 150;
  private readonly symbolSize: number = 100;
  private readonly reelHeight: number = 3;
  private readonly reelCount: number = 3;
  private state: SlotState = SlotState.IDLE;
  private stoppedReels: number = 0;
  private isAutoplay = false;
  private autoplayRounds = 0;
  private maxAutoplayRounds = 10;
  private freeSpins = 0;
  private balance: number = 100;

  constructor(app: Application) {
    super();
    this.app = app;
  }

  start() {
    this.createReels();
    this.addSpinButton();
  }

  private updateWinDisplay() {
    const display = document.getElementById("win-display");
    if (display) {
      display.textContent = `Balance: $${this.balance}`;
    }
  }

  private updateFreeSpinDisplay() {
    const display = document.getElementById("free_spin");
    if (display) {
      display.textContent = `Free Spines: ${this.freeSpins}`;
    }
  }

  private setState(newState: SlotState) {
    console.log(`FSM: ${this.state} → ${newState}`);
    console.log("AutoplayRounds: ", this.autoplayRounds);
    console.log("Free Spins: ", this.freeSpins);
    this.state = newState;
    this.updateSpinButton();
  }

  private createReels() {
    this.updateWinDisplay();
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

  private updateSpinButton() {
    this.addSpinButton();
  }

  private addSpinButton() {
    const container = new Container();

    // Background
    const background = new Graphics().fill(0x3333ff).roundRect(0, 0, 200, 60, 10).fill();
    const disabledBackground = new Graphics().fill(0x666666).roundRect(0, 0, 200, 60, 10).fill();

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
    const isDisabled =
      this.freeSpins > 0 || this.autoplayRounds > 0 || this.state !== SlotState.IDLE;
    container.addChild(isDisabled ? disabledBackground : background, button);

    container.interactive = true;
    container.eventMode = "dynamic";
    container.cursor = isDisabled ? "not-allowed" : "pointer";
    container.x = this.app.screen.width / 2;
    container.y = this.app.screen.height - 80;
    container.pivot.set(100, 30);

    container.on("pointerdown", () => {
      if (this.state === SlotState.IDLE) {
        this.spinReels();
      } else if (this.state === SlotState.FREE_SPIN) {
        this.spinReels();
        this.freeSpins--;
        this.updateFreeSpinDisplay();
      }
    });

    // Autoplay button
    const autoText = new Text({ text: "AUTO", style });
    autoText.anchor.set(0.5);
    autoText.x = 300;
    autoText.y = 30;
    autoText.interactive = true;
    autoText.eventMode = "dynamic";
    autoText.cursor = "pointer";
    autoText.on("pointerdown", () => {
      this.isAutoplay = !this.isAutoplay;
      if (this.isAutoplay && this.state === SlotState.IDLE && this.balance >= 10) {
        this.autoplayRounds = this.maxAutoplayRounds;
        this.spinReels();
      } else {
        this.updateSpinButton();
        alert("Not enough rounds to autoplay!");
      }
    });

    container.addChild(autoText);
    this.app.stage.addChild(container);
  }

  private spinReels() {
    if (this.state !== SlotState.IDLE && this.state !== SlotState.FREE_SPIN) return;
    if (this.balance < 10) {
      alert("Not enough balance to spin!");
      this.setState(SlotState.IDLE);
      this.updateWinDisplay();
      this.isAutoplay = false;
      this.autoplayRounds = 0;
      return;
    }
    this.setState(SlotState.SPINNING);
    this.stoppedReels = 0;
    this.balance -= 10; // Deduct cost per spin
    this.updateWinDisplay();

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      reel.speed = 0.5 + i * 0.15;
      reel.spinning = true;

      setTimeout(
        () => {
          reel.targetStop = Math.floor(Math.random() * this.symbols.length);
          reel.stopping = true;

          if (i === this.reels.length - 1) {
            this.setState(SlotState.STOPPING);
          }
        },
        1000 + i * 600
      );
    }
  }

  private checkWin() {
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

    // Simulate bonus free spins
    if (Math.random() < 0.2) {
      this.freeSpins += 1;
      this.updateFreeSpinDisplay();
    }

    const winText =
      winAmount > 0 ? `WIN ${winAmount}$!\n(${winningLines.join(", ")})` : "TRY AGAIN";

    const message = new Text({
      text: winText,
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
    this.balance += winAmount;
    this.updateWinDisplay();

    setTimeout(() => {
      this.app.stage.removeChild(message);
      if (this.freeSpins > 0) {
        this.setState(SlotState.FREE_SPIN);
        this.spinReels();
        this.freeSpins--;
        this.updateFreeSpinDisplay();
      } else if (this.isAutoplay && this.autoplayRounds > 0) {
        this.autoplayRounds--;
        this.setState(SlotState.IDLE);
        this.spinReels();
      } else {
        this.setState(SlotState.IDLE);
      }
    }, 1500);
  }

  private updateReels(deltaMS: number) {
    const delta = deltaMS / 16.6667; // 60 FPS

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
          this.setState(SlotState.SHOW_WIN);
          this.checkWin();
        }
      }
    }
  }

  private randomSymbol() {
    const index = Math.floor(Math.random() * this.symbols.length);
    return this.symbols[index];
  }
}
