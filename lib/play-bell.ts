function playSound(primarySrc: string, fallbackSrc?: string) {
  const audio = new Audio(primarySrc);
  audio.volume = 0.8;
  audio.currentTime = 0;

  if (fallbackSrc) {
    audio.addEventListener(
      "error",
      () => {
        const fallbackAudio = new Audio(fallbackSrc);
        fallbackAudio.volume = 0.8;
        fallbackAudio.currentTime = 0;
        void fallbackAudio.play();
      },
      { once: true },
    );
  }

  void audio.play();
}

export function playBell() {
  playSound("/ring.mp3", "/school-ring-bell.mp3");
}

export function playStartSound() {
  playSound("/timer-start.mp3");
}
