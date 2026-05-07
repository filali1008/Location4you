import * as React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Flotte } from '@/pages/Flotte';
import { Locations } from '@/pages/Locations';
import { Charges } from '@/pages/Charges';
import { Factures } from '@/pages/Factures';
import { Rapports } from '@/pages/Rapports';
import { Planning } from '@/pages/Planning';
import { Sinistres } from '@/pages/Sinistres';
import { DocumentsDrive } from '@/pages/DocumentsDrive';
import { JournalAudit } from '@/pages/JournalAudit';
import { Parametres } from '@/pages/Parametres';
import { AgentChatWidget } from '@/components/AgentChat';

const App: React.FC = function () {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flotte" element={<Flotte />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/charges" element={<Charges />} />
            <Route path="/factures" element={<Factures />} />
            <Route path="/rapports-financiers" element={<Rapports />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/sinistres" element={<Sinistres />} />
            <Route path="/documents-drive" element={<DocumentsDrive />} />
            <Route path="/journal-audit" element={<JournalAudit />} />
            <Route path="/parametres" element={<Parametres />} />
          </Routes>
        </Layout>
        <AgentChatWidget />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
