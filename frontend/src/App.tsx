import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Preview from "@/pages/Preview";
import SelectionList from "@/pages/SelectionList";
import ComparePage from "@/pages/ComparePage";
import Layout from "@/components/Layout";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/list" element={<SelectionList />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
