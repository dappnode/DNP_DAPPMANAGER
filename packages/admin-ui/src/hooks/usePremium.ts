export const usePremium = (): {
  isLoading: boolean;
  isInstalled: boolean;
  isRunning: boolean;
  isActivated: boolean;
} => {
  const isLoading = false;
  const isInstalled = true;
  const isRunning = true;
  const isActivated = true;

  return {
    isLoading,
    isInstalled,
    isRunning,
    isActivated
  };
};
