import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { configurationService } from '../api/services';
import { useAuth } from './AuthContext';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const { isAuth } = useAuth();
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuth) {
      setConfig(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await configurationService.getStatus();
      setConfig(res.data);
      setRefreshKey((k) => k + 1);
    } catch {
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ConfigContext.Provider value={{
      config,
      isLoading,
      isConfigured: config?.est_configure || false,
      anneeActive: config?.annee_active || null,
      semestreActif: config?.semestre_actif || null,
      toutesAnnees: config?.toutes_annees || [],
      refresh,
      refreshKey,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
}
