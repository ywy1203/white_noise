export function useOrientation() {
  function lockLandscape() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {})
    }
  }

  return { lockLandscape }
}
