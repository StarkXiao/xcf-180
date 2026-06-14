import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Preview from "@/pages/Preview";
import SelectionList from "@/pages/SelectionList";
import ComparePage from "@/pages/ComparePage";
import SharePage from "@/pages/SharePage";
import OrderListPage from "@/pages/OrderListPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import Layout from "@/components/Layout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/preview" element={<Preview />} />
                <Route path="/list" element={<SelectionList />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/orders" element={<OrderListPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
