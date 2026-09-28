import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Home } from './pages/Home';
import { Clients } from './pages/Clients';
import { Loans } from './pages/Loans';
import { Calendar } from './pages/Calendar';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ClientModal } from './components/clients/ClientModal';
import { LoanModal } from './components/loans/LoanModal';
import { LoanReceiptModal } from './components/loans/LoanReceiptModal';
import { PaymentModal } from './components/loans/PaymentModal';
import { PaywallModal } from './components/subscription/PaywallModal';
import { DeleteAccountModal } from './components/auth/DeleteAccountModal';
import { storageService } from './services/storageService';
import { supabaseSyncService } from './services/supabaseSyncService';
import { supabase } from './services/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { Landing } from './pages/Landing';
import { Login } from './components/auth/Login';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from './types';

// Detectar si la app corre como aplicación nativa (Android/iOS) o PWA instalada
const isNativeOrStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 1. Capacitor Nativo (Android / iOS)
  if (Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web') {
    return true;
  }

  // 2. Esquemas o hosts de WebView nativo
  if (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  ) {
    return true;
  }

  // 3. PWA Standalone instalada en pantalla de inicio
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return isStandalone;
};

// Determinar vista pública inicial según la URL / hash del navegador
const getInitialPublicView = (): 'landing' | 'login' | 'privacidad' | 'terminos' => {
  // En apps nativas o PWA instalada nunca ir a landing
  if (isNativeOrStandalone()) {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('privacidad') || hash.includes('privacidad') || path.includes('privacy')) return 'privacidad';
    if (path.includes('terminos') || hash.includes('terminos') || path.includes('terms')) return 'terminos';
    return 'login';
  }

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.includes('privacidad') || hash.includes('privacidad') || path.includes('privacy')) return 'privacidad';
  if (path.includes('terminos') || hash.includes('terminos') || path.includes('terms')) return 'terminos';
  if (path.includes('login') || hash.includes('login') || path.includes('auth')) return 'login';

  return 'landing';
};

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'privacidad' | 'terminos'>(getInitialPublicView);
  
  // State de Autenticación
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State principal de la aplicación
  const [clients, setClients] = useState<Client[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [capitalBox, setCapitalBox] = useState<CapitalBox>({
    initialCapital: 0,
    currentCapital: 0,
    totalLent: 0,
    totalRecovered: 0,
    totalInterestRecovered: 0
  });
  const [transactions, setTransactions] = useState<CapitalTransaction[]>([]);

  // Filtros iniciales de navegación
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [loansFilter, setLoansFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');

  // Control de Modales
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [defaultClientId, setDefaultClientId] = useState<string | undefined>(undefined);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeLoanForReceipt, setActiveLoanForReceipt] = useState<Loan | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeInstallmentForPayment, setActiveInstallmentForPayment] = useState<Installment | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Contexto de Suscripción
  const { canCreateClient, canCreateLoan, isPaywallOpen, closePaywall } = useSubscription();

  // Cargar y refrescar datos
  const refreshData = () => {
    setClients(storageService.getClients());
    setLoans(storageService.getLoans());
    setInstallments(storageService.getInstallments());
    setCapitalBox(storageService.getCapitalBox());
    setTransactions(storageService.getTransactions());
  };

  useEffect(() => {
    let active = true;

    // Escuchar cambios de URL/Hash para navegación directa
    const handleUrlChange = () => {
      setPublicView(getInitialPublicView());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        setSession(session);
        setAuthLoading(false);
        if (session?.user) {
          storageService.setCurrentUser(session.user.id);
          refreshData();
          supabaseSyncService.syncDown(() => {
            if (active) refreshData();
          });
        }
      }
    });

    // 2. Escuchar cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (active) {
        setSession(newSession);
        setAuthLoading(false);
        if (newSession?.user) {
          storageService.setCurrentUser(newSession.user.id);
          refreshData();
          supabaseSyncService.syncDown(() => {
            if (active) refreshData();
          });
        } else {
          // Limpiar datos al cerrar sesión
          storageService.clearUserData();
          setClients([]);
          setLoans([]);
          setInstallments([]);
          setCapitalBox({
            initialCapital: 0,
            currentCapital: 0,
            totalLent: 0,
            totalRecovered: 0,
            totalInterestRecovered: 0
          });
          setTransactions([]);
        }
      }
    });

    // 3. Escuchar actualizaciones de sincronización
    const handleSyncUpdate = () => {
      if (active && session) refreshData();
    };
    window.addEventListener('credipresta_sync_updated', handleSyncUpdate);
    window.addEventListener('prestalo_sync_updated', handleSyncUpdate);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('credipresta_sync_updated', handleSyncUpdate);
      window.removeEventListener('prestalo_sync_updated', handleSyncUpdate);
    };
  }, [session ? session.user.id : null]);

  // CLIENTS ACTIONS
  const handleSaveClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'status'> & { id?: string }) => {
    storageService.saveClient(clientData);
    refreshData();
  };

  const handleEditClientClick = (client: Client) => {
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    storageService.deleteClient(id);
    refreshData();
  };

  const openNewClientModal = () => {
    if (!canCreateClient(clients.length)) {
      return;
    }
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  // LOAN ACTIONS
  const handleCreateLoan = (loanData: Omit<Loan, 'id' | 'totalToPay' | 'endDate' | 'status'>) => {
    const { loan } = storageService.createLoan(loanData);
    refreshData();
    // Abrir comprobante inmediatamente
    setActiveLoanForReceipt(loan);
    setIsReceiptModalOpen(true);
  };

  const handleDeleteLoan = (id: string) => {
    storageService.deleteLoan(id);
    refreshData();
  };

  const handleViewReceipt = (loan: Loan) => {
    setActiveLoanForReceipt(loan);
    setIsReceiptModalOpen(true);
  };

  const openNewLoanModal = (clientId?: string) => {
    if (!canCreateLoan(loans.length)) {
      return;
    }
    setDefaultClientId(clientId);
    setIsLoanModalOpen(true);
  };

  // INSTALLMENTS & PAYMENT ACTIONS
  const openPaymentModal = (installment: Installment) => {
    setActiveInstallmentForPayment(installment);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (installmentId: string, amount: number, isPactada?: boolean) => {
    storageService.payInstallment(installmentId, amount, isPactada);
    refreshData();
  };

  const handleConfirmRenewal = (installmentId: string, interestAmount: number) => {
    storageService.renewInstallmentWithInterest(installmentId, interestAmount);
    refreshData();
  };

  // CAPITAL ACTIONS
  const handleUpdateCapital = (newCapital: number) => {
    storageService.setInitialCapital(newCapital);
    refreshData();
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ animation: 'spin 1s linear infinite', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '30px', height: '30px' }}></div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    const isNative = isNativeOrStandalone();

    if (publicView === 'privacidad') {
      return <PrivacyPolicy onBack={() => setPublicView(isNative ? 'login' : 'landing')} />;
    }
    if (publicView === 'terminos') {
      return <TermsAndConditions onBack={() => setPublicView(isNative ? 'login' : 'landing')} />;
    }
    if (publicView === 'login' || isNative) {
      return (
        <Login 
          onBackToLanding={isNative ? undefined : () => setPublicView('landing')}
          onOpenTerms={() => setPublicView('terminos')}
          onOpenPrivacy={() => setPublicView('privacidad')}
        />
      );
    }
    return (
      <Landing
        onOpenLogin={() => setPublicView('login')}
        onOpenRegister={() => setPublicView('login')}
        onOpenTerms={() => setPublicView('terminos')}
        onOpenPrivacy={() => setPublicView('privacidad')}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <Home
            clients={clients}
            loans={loans}
            installments={installments}
            capitalBox={capitalBox}
            setActiveTab={setActiveTab}
            openNewClientModal={openNewClientModal}
            openNewLoanModal={() => openNewLoanModal()}
            onUpdateCapital={handleUpdateCapital}
            onNavigateToOverdueCalendar={() => {
              setCalendarFilter('overdue');
              setActiveTab('calendario');
            }}
            onNavigateToOverdueLoans={() => {
              setLoansFilter('overdue');
              setActiveTab('prestamos');
            }}
          />
        );
      case 'clientes':
        return (
          <Clients
            clients={clients}
            loans={loans}
            installments={installments}
            openNewClientModal={openNewClientModal}
            onEditClient={handleEditClientClick}
            onDeleteClient={handleDeleteClient}
            onOpenPaymentModal={openPaymentModal}
          />
        );
      case 'prestamos':
        return (
          <Loans
            loans={loans}
            installments={installments}
            openNewLoanModal={() => openNewLoanModal()}
            onDeleteLoan={handleDeleteLoan}
            onViewReceipt={handleViewReceipt}
            onOpenPaymentModal={openPaymentModal}
            initialStatusFilter={loansFilter}
          />
        );
      case 'calendario':
        return (
          <Calendar
            installments={installments}
            clients={clients}
            loans={loans}
            initialFilterStatus={calendarFilter}
            onPayInstallment={(id) => {
              const inst = installments.find(i => i.id === id);
              if (inst) openPaymentModal(inst);
            }}
          />
        );
      case 'reportes':
        return (
          <Reports
            clients={clients}
            loans={loans}
            installments={installments}
            capitalBox={capitalBox}
            transactions={transactions}
          />
        );
      case 'perfil':
        return (
          <Profile
            onOpenTerms={() => setActiveTab('terminos')}
            onOpenPrivacy={() => setActiveTab('privacidad')}
            onOpenDeleteAccount={() => setIsDeleteModalOpen(true)}
            onDataRefresh={refreshData}
          />
        );
      case 'terminos':
        return <TermsAndConditions onBack={() => setActiveTab('perfil')} />;
      case 'privacidad':
        return <PrivacyPolicy onBack={() => setActiveTab('perfil')} />;
      default:
        return <div>Página no encontrada</div>;
    }
  };

  return (
    <>
      <Header 
        activeTab={activeTab} 
        onDataRefresh={refreshData}
        onOpenProfile={() => setActiveTab('perfil')}
      />
      
      <main>
        {renderContent()}
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Modales globales de la aplicación */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
      />

      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        clients={clients}
        onSave={handleCreateLoan}
        defaultClientId={defaultClientId}
      />

      <LoanReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        loan={activeLoanForReceipt}
        installments={installments}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        installment={activeInstallmentForPayment}
        onConfirmPayment={handleConfirmPayment}
        onConfirmRenewal={handleConfirmRenewal}
      />

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={closePaywall}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <SubscriptionProvider>
      <MainApp />
    </SubscriptionProvider>
  );
};

export default App;
