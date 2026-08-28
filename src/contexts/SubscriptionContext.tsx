import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSubscription } from '../types';
import { supabaseSyncService } from '../services/supabaseSyncService';

// Flag de lanzamiento gratuito: Mientras sea true, todos los usuarios disfrutan de acceso 100% libre e ilimitado
export const IS_LAUNCH_FREE_MODE = true;

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  isPro: boolean;
  isLaunchFreeMode: boolean;
  isTrialActive: boolean;
  daysRemaining: number;
  maxFreeClients: number;
  canCreateClient: (currentClientCount: number) => boolean;
  canCreateLoan: (currentLoanCount: number) => boolean;
  isPaywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const maxFreeClients = 8;
  const maxFreeLoans = 10;

  const refreshSubscription = async () => {
    const sub = await supabaseSyncService.fetchUserSubscription();
    setSubscription(sub);
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  // Durante la etapa de lanzamiento, todo usuario tiene acceso full ilimitado
  const isPro = IS_LAUNCH_FREE_MODE || (subscription?.tier === 'pro' && subscription?.status === 'active');
  const isTrialActive = !IS_LAUNCH_FREE_MODE && subscription?.status === 'trialing';
  const daysRemaining = 0;

  const canCreateClient = (_currentClientCount: number): boolean => {
    if (IS_LAUNCH_FREE_MODE || isPro) return true;
    return _currentClientCount < maxFreeClients;
  };

  const canCreateLoan = (_currentLoanCount: number): boolean => {
    if (IS_LAUNCH_FREE_MODE || isPro) return true;
    return _currentLoanCount < maxFreeLoans;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isPro,
        isLaunchFreeMode: IS_LAUNCH_FREE_MODE,
        isTrialActive,
        daysRemaining,
        maxFreeClients,
        canCreateClient,
        canCreateLoan,
        isPaywallOpen,
        openPaywall: () => {
          if (!IS_LAUNCH_FREE_MODE) setIsPaywallOpen(true);
        },
        closePaywall: () => setIsPaywallOpen(false),
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription debe usarse dentro de un SubscriptionProvider');
  }
  return context;
};
