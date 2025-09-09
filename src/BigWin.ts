import { animate } from "animejs";

export class BigWin {
  private appElementId: string;
  private appElement: HTMLElement | null;
  private running = false;

  constructor(appElementId: string = "app") {
    this.appElementId = appElementId;
    this.appElement = document.getElementById(this.appElementId);
  }

  public start() {
    if (this.running) return;
    this.appElement = document.getElementById(this.appElementId);
    if (!this.appElement) {
      console.error(`Element with id "${this.appElementId}" not found`);
      return;
    }

    this.running = true;
    this.createCoins();
    window.addEventListener("resize", this.resizeHandler);
  }

  public stop() {
    if (!this.appElement) return;
    window.removeEventListener("resize", this.resizeHandler);
    this.appElement.querySelectorAll(".coin").forEach(coin => coin.remove());
  }

  private createCoins() {
    const coinCount = 10;

    for (let i = 0; i < coinCount; i++) {
      const coin = document.createElement("div");
      coin.className = "coin";
      const x = Math.random() * this.appElement!.offsetWidth; // Random X-position
      const size = 65 + Math.random() * 60; // random size
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      coin.style.left = `${x}px`;
      coin.style.top = `-${size}px`;
      this.appElement!.appendChild(coin);

      animate(coin, {
        translateY: this.appElement!.offsetHeight + size,
        duration: 3000 + Math.random() * 2000,
        easing: "linear",
        loop: true,
        delay: Math.random() * 1000
      });
    }
  }

  private resizeHandler = () => {
    if (!this.appElement) return;

    this.appElement.querySelectorAll(".coin").forEach(coin => {
      const coinEl = coin as HTMLElement;
      coinEl.style.left = `${Math.random() * this.appElement!.offsetWidth}px`;
      coinEl.style.top = `-${parseFloat(coinEl.style.width || "20")}px`;
    });
  };
}
