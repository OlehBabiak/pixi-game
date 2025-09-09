import { animate } from "animejs"; // Імпорт необхідних методів

export function initCoinAnimation(appElementId: string = "app") {
  const appElement = document.getElementById(appElementId);
  console.log(`Initializing coin animation for ${appElementId}`);
  if (!appElement) {
    console.error(`Element with id "${appElementId}" not found`);
    return () => {};
  }

  // Функція для створення монеток
  function createCoins() {
    const coinCount = 10; // Кількість монеток одночасно

    for (let i = 0; i < coinCount; i++) {
      const coin = document.createElement("div");
      coin.className = "coin";
      const x = Math.random() * appElement!.offsetWidth; // Випадкова X-позиція
      const size = 65 + Math.random() * 60;
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      coin.style.left = `${x}px`;
      coin.style.top = `-${size}px`; // Починаємо вище екрану
      appElement!.appendChild(coin);

      animate(coin, {
        translateY: appElement!.offsetHeight + size,
        duration: 3000 + Math.random() * 2000,
        easing: "linear",
        loop: true,
        delay: Math.random() * 1000
      });
    }
  }

  // Запуск створення монеток
  createCoins();

  // Обробка зміни розміру вікна
  const resizeHandler = () => {
    appElement.querySelectorAll(".coin").forEach(coin => {
      const coinEl = coin as HTMLElement;
      coinEl.style.left = `${Math.random() * appElement.offsetWidth}px`;
      coinEl.style.top = `-${parseFloat(coinEl.style.width || "20")}px`;
      coinEl.style.transform = "translateY(0px)"; // Скидаємо transform
    });
  };
  window.addEventListener("resize", resizeHandler);

  // Очищення при розвантаженні
  return () => {
    window.removeEventListener("resize", resizeHandler);
    appElement.querySelectorAll(".coin").forEach(coin => coin.remove());
  };
}
