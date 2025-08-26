import {
  Application,
  Container,
  FillGradient,
  Graphics,
  Text,
  TextStyle,
  TextStyleAlign,
  Sprite,
  Assets
} from "pixi.js";
import { SlotStateMachine, SlotState, Observer } from "./SlotStateMachine";
import { GameLoader } from "./GameLoader";
import { Spine } from "@esotericsoftware/spine-pixi-v8";

interface Reel {
  container: Container;
  symbols: Sprite[];
  position: number;
  speed: number;
  targetStop: number;
  spinning: boolean;
  stopping?: boolean;
}

interface SymbolSprite extends Sprite {
  symbolKey: string;
}
export class SlotMachine extends Container implements Observer {
  private app: Application;
  private reels: Reel[] = [];
  private symbolKeys = ["cherry", "bell", "lemon", "orange", "star", "seven"];
  private readonly reelWidth: number = 150;
  private readonly symbolSize: number = 100;
  private readonly reelHeight: number = 3;
  private readonly reelCount: number = 3;
  private stoppedReels: number = 0;
  private isAutoplay = false;
  private autoplayRounds = 0;
  private maxAutoplayRounds = 10;
  private freeSpins = 0;
  private balance: number = 100;
  private fsm: SlotStateMachine;
  private spinButtonContainer?: Container;
  private balanceContainer?: Container;
  private freeSpinContainer?: Container;
  private spineContainer?: Spine;
  private wasInFreeSpin: boolean = false;
  private freeSpinSpineText?: Text;

  constructor(app: Application) {
    super();
    this.app = app;
    this.fsm = new SlotStateMachine();
    this.fsm.subscribe(this);
  }

  update(newState: SlotState): void {
    switch (newState) {
      case SlotState.LOADING:
        break;
      case SlotState.IDLE:
        this.updateSpinButton();
        break;
      case SlotState.SPINNING:
        this.startSpin();
        break;
      case SlotState.STOPPING:
        break;
      case SlotState.SHOW_WIN:
        this.checkWin();
        break;
      case SlotState.FREE_SPIN:
        this.spinReels();
        break;
    }
  }

  public start() {
    this.fsm.setState(SlotState.LOADING);
    const loader = new GameLoader(spineCharacter => {
      this.app.stage.removeChild(loader);
      if (spineCharacter) {
        this.spineContainer = spineCharacter;
        this.spineContainer.x = this.app.screen.width / 2;
        this.spineContainer.y = this.app.screen.height / 2;
        this.spineContainer.scale.set(1.5);
        this.spineContainer.visible = false;
        this.app.stage.addChild(this.spineContainer);
      }
      this.createBackground();
      this.createReels();
      this.updateFreeSpinDisplay();
      this.updateSpinButton();
      this.updateWinDisplay();
      this.fsm.setState(SlotState.IDLE);
    });

    this.app.stage.addChild(loader);
  }

  // Метод для анімації фріспінів
  private playFreeSpinAnimation(isStart: boolean) {
    if (!this.spineContainer) return;
    console.log("playFreeSpinAnimation", isStart);
    this.spineContainer.autoUpdate = false;
    // Показуємо контейнер
    this.spineContainer.visible = true;

    if (isStart) {
      this.spineContainer.state.setAnimation(0, "in", false);
      this.spineContainer.state.addAnimation(0, "idle", true, 0);

      // Add or update text in text_slot
      const slot = this.spineContainer.skeleton.findSlot("text_slot");
      if (slot) {
        if (!this.freeSpinSpineText) {
          const textStyle = new TextStyle({
            fontFamily: "Arial",
            fontSize: 36, // Adjust size to fit your board
            fill: "#ffffff", // White text, adjust as needed
            align: "center",
            stroke: { color: "#000000", width: 2 } // Optional outline for visibility
          });

          this.freeSpinSpineText = new Text({
            text: `Free Spins: ${this.freeSpins}`,
            style: textStyle
          });
          this.freeSpinSpineText.anchor.set(0.5); // Center the text

          this.spineContainer.addSlotObject(slot, this.freeSpinSpineText, {
            followAttachmentTimeline: true
          });
        } else {
          this.freeSpinSpineText.text = `Free Spins: ${this.freeSpins}`;
        }
      }
    } else {
      this.spineContainer.state.setAnimation(0, "out", false); // Lowercase
      this.spineContainer.state.addAnimation(0, "idle", true, 0);

      // Hide after animation and remove text
      setTimeout(() => {
        const slot = this.spineContainer?.skeleton.findSlot("text_slot");
        if (slot && this.freeSpinSpineText) {
          this.spineContainer?.removeSlotObject(slot); // Один аргумент
          this.freeSpinSpineText.destroy();
          this.freeSpinSpineText = undefined;
        }
        this.spineContainer!.visible = false;
      }, 1000);
    }
    this.spineContainer.autoUpdate = false; // Залишаємо вимкненим, оновлюємо вручну
    this.app.ticker.add(() => this.spineContainer?.update(this.app.ticker.deltaMS / 1000));
  }

  private createBackground() {
    const secondaryBGTexture = Assets.get("secondaryBG");

    if (secondaryBGTexture) {
      const secondaryBG = new Sprite(secondaryBGTexture);
      secondaryBG.width = this.app.screen.width;
      secondaryBG.height = this.app.screen.height;
      this.app.stage.addChildAt(secondaryBG, 0); // на задній план Pixi
    }
  }

  private randomSymbolKey() {
    const index = Math.floor(Math.random() * this.symbolKeys.length);
    return this.symbolKeys[index];
  }

  private updateWinDisplay() {
    if (this.balanceContainer) {
      this.app.stage.removeChild(this.balanceContainer);
    }

    const container = new Container();
    this.balanceContainer = container;

    const style = new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff
    });

    const balance = new Text({
      text: `Balance: $${this.balance}`,
      style: style
    });
    balance.x = 20;
    balance.y = 30;

    container.addChild(balance);
    this.app.stage.addChild(container);
  }

  private updateFreeSpinDisplay() {
    if (this.freeSpinContainer) {
      this.app.stage.removeChild(this.freeSpinContainer);
    }

    const container = new Container();
    this.freeSpinContainer = container;
    const style = new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff
    });
    const freeSpin = new Text({
      text: `Free Spines: ${this.freeSpins}`,
      style: style
    });
    freeSpin.x = 20;
    freeSpin.y = 70;

    container.addChild(freeSpin);
    this.app.stage.addChild(container);
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
        const key = this.randomSymbolKey();
        const texture = Assets.get(key);
        const symbol: SymbolSprite = new Sprite(texture) as SymbolSprite;
        console.log(`Assets: ${Assets.get(key)} for key ${key}`);
        symbol.anchor.set(0.5);
        symbol.x = this.reelWidth / 2;
        symbol.y = j * this.symbolSize;
        symbol.width = this.symbolSize;
        symbol.height = this.symbolSize;

        // Зберігаємо ключ символу для checkWin
        symbol.symbolKey = key;

        container.addChild(symbol);
        reel.symbols.push(symbol);
      }

      this.reels.push(reel);
    }

    this.app.ticker.add(ticker => this.updateReels(ticker.deltaMS));
  }

  private updateSpinButton() {
    if (this.spinButtonContainer) {
      this.app.stage.removeChild(this.spinButtonContainer);
    }
    const container = new Container();
    this.spinButtonContainer = container;
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
      this.freeSpins > 0 || this.autoplayRounds > 0 || this.fsm.state !== SlotState.IDLE;
    container.addChild(isDisabled ? disabledBackground : background, button);

    container.interactive = !isDisabled;
    container.eventMode = "dynamic";
    container.cursor = isDisabled ? "not-allowed" : "pointer";
    container.x = this.app.screen.width / 2;
    container.y = this.app.screen.height - 80;
    container.pivot.set(100, 30);

    if (!isDisabled) {
      container.on("pointerdown", () => {
        if (this.fsm.state === SlotState.IDLE) {
          this.spinReels();
          this.updateSpinButton();
        } else if (this.fsm.state === SlotState.FREE_SPIN) {
          this.spinReels();
          this.freeSpins--;
          this.updateFreeSpinDisplay();
        }
      });
    }

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
      if (this.isAutoplay && this.fsm.state === SlotState.IDLE && this.balance >= 10) {
        this.autoplayRounds = this.maxAutoplayRounds;
        this.spinReels();
        this.updateSpinButton();
      } else {
        this.updateSpinButton();
        alert("Not enough rounds to autoplay!");
      }
    });

    container.addChild(autoText);
    this.app.stage.addChild(container);
  }

  private spinReels() {
    if (this.fsm.state !== SlotState.IDLE && this.fsm.state !== SlotState.FREE_SPIN) return;
    if (this.balance < 10 && this.freeSpins === 0) {
      alert("Not enough balance to spin!");
      this.isAutoplay = false;
      this.autoplayRounds = 0;
      this.fsm.unsubscribe(this);
      return;
    }
    if (this.freeSpins === 0) {
      this.balance -= 10; // Deduct cost per spin
    }
    this.updateWinDisplay();
    this.fsm.setState(SlotState.SPINNING);
  }

  private startSpin() {
    this.stoppedReels = 0;
    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      reel.speed = 0.5 + i * 0.15;
      reel.spinning = true;
      setTimeout(
        () => {
          reel.targetStop = Math.floor(Math.random() * this.symbolKeys.length);
          reel.stopping = true;
          if (i === this.reels.length - 1) this.fsm.setState(SlotState.STOPPING);
        },
        1000 + i * 600
      );
    }
  }

  private checkWin() {
    let winAmount = 0;
    const winningLines: string[] = [];

    const payLines = {
      top: this.reels.map(reel => (reel.symbols[1] as SymbolSprite).symbolKey),
      middle: this.reels.map(reel => (reel.symbols[2] as SymbolSprite).symbolKey),
      bottom: this.reels.map(reel => (reel.symbols[3] as SymbolSprite).symbolKey),
      diagonalDown: this.reels.map((reel, i) => (reel.symbols[1 + i] as SymbolSprite)?.symbolKey),
      diagonalUp: this.reels.map((reel, i) => (reel.symbols[3 - i] as SymbolSprite)?.symbolKey)
    };

    Object.entries(payLines).forEach(([payLine, symbols]) => {
      const allEqual = symbols.every(sym => sym === symbols[0]);
      if (!allEqual) return;

      switch (payLine) {
        case "top":
          winAmount += 100;
          break;
        case "middle":
          winAmount += 300;
          break;
        case "bottom":
          winAmount += 100;
          break;
        case "diagonalDown":
          winAmount += 50;
          break;
        case "diagonalUp":
          winAmount += 50;
          break;
      }
      winningLines.push(payLine);
    });

    if (Math.random() < 0.2) {
      this.freeSpins += 2;
      this.updateFreeSpinDisplay();

      if (!this.wasInFreeSpin) {
        this.playFreeSpinAnimation(true);
        this.wasInFreeSpin = true;
      }
      //  else if (this.freeSpinSpineText) {
      //   // If already in free spins, just update the text
      //   this.freeSpinSpineText.text = `Free Spins: ${this.freeSpins}`;
      // }
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

      // Decrement freeSpins BEFORE starting next spin
      if (this.freeSpins > 0) {
        this.freeSpins--;
        this.updateFreeSpinDisplay();
        if (this.freeSpinSpineText) {
          this.freeSpinSpineText.text = `Free Spins: ${this.freeSpins}`;
        }
        this.fsm.setState(SlotState.FREE_SPIN);
        this.spinReels();
      } else if (this.isAutoplay && this.autoplayRounds > 0) {
        if (this.wasInFreeSpin) {
          // No add on last spin
          this.playFreeSpinAnimation(false); // OUT
          this.wasInFreeSpin = false;
        }
        this.autoplayRounds--;
        this.fsm.setState(SlotState.IDLE);
        this.spinReels();
      } else {
        if (this.wasInFreeSpin) {
          // No add on last spin
          this.playFreeSpinAnimation(false); // OUT
          this.wasInFreeSpin = false;
        }
        this.fsm.setState(SlotState.IDLE);
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

        const first = reel.symbols.shift()! as SymbolSprite;
        const key = this.randomSymbolKey();
        first.texture = Assets.get(key);
        first.width = this.symbolSize;
        first.height = this.symbolSize;
        first.y = reel.symbols[reel.symbols.length - 1].y + this.symbolSize;

        first.symbolKey = key;

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
          this.fsm.setState(SlotState.SHOW_WIN);
        }
      }
    }
  }
}
