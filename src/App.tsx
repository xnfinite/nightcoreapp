import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";

import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import ProofLogs from "./pages/ProofLogs";
import Timeline from "./pages/Timeline";
import Backends from "./pages/Backends";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Anomaly from "./pages/Anomaly";
import Policies from "./pages/Policies";
import Quarantine from "./pages/Quarantine";
import Inbox from "./pages/Inbox";

import Guardian from "./pages/Guardian";
import GuardianLogs from "./pages/GuardianLogs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/proof-logs" element={<ProofLogs />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/backends" element={<Backends />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/quarantine" element={<Quarantine />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/anomaly" element={<Anomaly />} />
          <Route path="/guardian" element={<Guardian />} />
          <Route path="/guardian-logs" element={<GuardianLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
