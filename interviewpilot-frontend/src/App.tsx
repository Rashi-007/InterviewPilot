import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Overview } from "@/pages/Overview";
import { Applications } from "@/pages/Applications";
import { MockInterview } from "@/pages/MockInterview";
import { Insights } from "@/pages/Insights";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { CompanyQuestions } from "@/pages/CompanyQuestions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Overview />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/mock-interview" element={<MockInterview />} />
        <Route path="/company-questions" element={<CompanyQuestions />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
