import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Preview from "@/pages/Preview";
import SelectionList from "@/pages/SelectionList";
import ComparePage from "@/pages/ComparePage";
import SharePage from "@/pages/SharePage";
import OrderListPage from "@/pages/OrderListPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import AdminCategoriesPage from "@/pages/AdminCategoriesPage";
import AdminPartsPage from "@/pages/AdminPartsPage";
import AdminCompatibilityPage from "@/pages/AdminCompatibilityPage";
import AdminPricePage from "@/pages/AdminPricePage";
import AdminReviewPage from "@/pages/AdminReviewPage";
import TemplateCenterPage from "@/pages/TemplateCenterPage";
import TemplateDetailPage from "@/pages/TemplateDetailPage";
import AdminTemplatesPage from "@/pages/AdminTemplatesPage";
import AdminInventoryPage from "@/pages/AdminInventoryPage";
import QuoteListPage from "@/pages/QuoteListPage";
import QuoteDetailPage from "@/pages/QuoteDetailPage";
import AdminDiscountRulesPage from "@/pages/AdminDiscountRulesPage";
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
                <Route path="/templates" element={<TemplateCenterPage />} />
                <Route path="/templates/:id" element={<TemplateDetailPage />} />
                <Route path="/orders" element={<OrderListPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/quotes" element={<QuoteListPage />} />
                <Route path="/quotes/:id" element={<QuoteDetailPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/discount-rules" element={<AdminDiscountRulesPage />} />
                <Route path="/admin/parts" element={<AdminPartsPage />} />
                <Route path="/admin/compatibility" element={<AdminCompatibilityPage />} />
                <Route path="/admin/price" element={<AdminPricePage />} />
                <Route path="/admin/review" element={<AdminReviewPage />} />
                <Route path="/admin/templates" element={<AdminTemplatesPage />} />
                <Route path="/admin/inventory" element={<AdminInventoryPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
