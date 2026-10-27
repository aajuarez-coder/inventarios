import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken 
} from '../services/googleAuth';
import { 
  getGmailProfile, 
  sendGmailEmail, 
  listGmailMessages, 
  GmailProfile, 
  GmailMessageSummary, 
  SendEmailPayload 
} from '../services/gmailService';
import { GmailConfirmSendModal } from '../components/GmailConfirmSendModal';

interface GmailContextType {
  googleUser: User | null;
  gmailProfile: GmailProfile | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectGoogle: () => Promise<boolean>;
  disconnectGoogle: () => Promise<void>;
  sendEmailWithConfirmation: (payload: SendEmailPayload, summary: string) => Promise<{ success: boolean; error?: string }>;
  sendDirectEmail: (payload: SendEmailPayload) => Promise<{ success: boolean; error?: string; id?: string }>;
  fetchRecentMessages: (query?: string, maxResults?: number) => Promise<GmailMessageSummary[]>;
  refreshProfile: () => Promise<void>;
}

const GmailContext = createContext<GmailContextType | null>(null);

export const GmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for pending confirmation modal
  const [pendingConfirm, setPendingConfirm] = useState<{
    payload: SendEmailPayload;
    summary: string;
    resolve: (res: { success: boolean; error?: string }) => void;
  } | null>(null);
  const [isExecutingSend, setIsExecutingSend] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getGmailProfile();
      setGmailProfile(profile);
    } catch (err: any) {
      console.warn('Could not fetch Gmail profile:', err?.message);
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setGoogleUser(user);
        loadProfile();
      },
      () => {
        setGoogleUser(null);
        setGmailProfile(null);
      }
    );

    return () => unsubscribe();
  }, [loadProfile]);

  const connectGoogle = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        try {
          const profile = await getGmailProfile();
          setGmailProfile(profile);
        } catch (profileErr: any) {
          console.warn('Gmail profile error:', profileErr);
        }
        return true;
      }
      // Result is null when user closes popup or cancels
      return false;
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        // User closed or cancelled popup - not an application failure
        return false;
      }
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
        setError('La ventana emergente de Google fue bloqueada por el navegador. Habilite las ventanas emergentes para continuar.');
        return false;
      }
      console.error('Connection failed:', err);
      setError(err?.message || 'Error al conectar con Google/Gmail');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogle = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGmailProfile(null);
    } catch (err: any) {
      console.error('Error logging out from Google:', err);
    }
  };

  const refreshProfile = async () => {
    if (googleUser) {
      await loadProfile();
    }
  };

  /**
   * Prompts the user with the mandatory confirmation dialog before dispatching via Gmail API.
   */
  const sendEmailWithConfirmation = (
    payload: SendEmailPayload, 
    summary: string
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      setPendingConfirm({
        payload,
        summary,
        resolve
      });
    });
  };

  /**
   * Directly sends an email via Gmail API if confirmation was already gathered or explicitly granted.
   */
  const sendDirectEmail = async (payload: SendEmailPayload): Promise<{ success: boolean; error?: string; id?: string }> => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return { success: false, error: 'Debe conectar su cuenta de Google / Gmail para realizar envíos.' };
      }

      const res = await sendGmailEmail(payload);
      await loadProfile(); // refresh messages total
      return { success: true, id: res.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error desconocido al enviar correo vía Gmail' };
    }
  };

  const handleConfirmSend = async () => {
    if (!pendingConfirm) return;
    setIsExecutingSend(true);
    try {
      const res = await sendDirectEmail(pendingConfirm.payload);
      pendingConfirm.resolve(res);
      setPendingConfirm(null);
    } catch (err: any) {
      pendingConfirm.resolve({ success: false, error: err?.message || 'Error al enviar correo' });
      setPendingConfirm(null);
    } finally {
      setIsExecutingSend(false);
    }
  };

  const handleCancelSend = () => {
    if (!pendingConfirm) return;
    pendingConfirm.resolve({ success: false, error: 'Operación cancelada por el usuario' });
    setPendingConfirm(null);
  };

  const fetchRecentMessages = async (query = '', maxResults = 10): Promise<GmailMessageSummary[]> => {
    return listGmailMessages(query, maxResults);
  };

  const isConnected = Boolean(googleUser);

  return (
    <GmailContext.Provider
      value={{
        googleUser,
        gmailProfile,
        isConnected,
        isConnecting,
        error,
        connectGoogle,
        disconnectGoogle,
        sendEmailWithConfirmation,
        sendDirectEmail,
        fetchRecentMessages,
        refreshProfile
      }}
    >
      {children}

      {/* Global Confirmation Modal for Gmail */}
      {pendingConfirm && (
        <GmailConfirmSendModal
          isOpen={true}
          to={pendingConfirm.payload.to}
          subject={pendingConfirm.payload.subject}
          summary={pendingConfirm.summary}
          senderEmail={gmailProfile?.emailAddress || googleUser?.email || undefined}
          isSending={isExecutingSend}
          onConfirm={handleConfirmSend}
          onCancel={handleCancelSend}
        />
      )}
    </GmailContext.Provider>
  );
};

export const useGmail = (): GmailContextType => {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error('useGmail must be used within a GmailProvider');
  }
  return context;
};
