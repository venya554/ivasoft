import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import PortfolioPage from "@/pages/PortfolioPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminPage from "@/pages/AdminPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  const [location] = useLocation();
  
  // Автоматическая прокрутка к началу страницы при смене роута
  useScrollToTop();
  
  // Не показываем Header и Footer на страницах авторизации, дашборда и админки
  const isAuthPage = location === "/auth";
  const isDashboardPage = location === "/dashboard" || location.startsWith("/dashboard/");
  const isAdminPage = location === "/admin";
  const showHeaderFooter = !isAuthPage && !isDashboardPage && !isAdminPage;
  
  return (
    <div className="flex flex-col min-h-screen">
      {showHeaderFooter && <Header />}
      <main className={`flex-grow ${!showHeaderFooter ? "p-0" : ""}`}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/portfolio" component={PortfolioPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/dashboard/:projectId" component={DashboardPage} />
          {/* Для AdminPage используем специальный компонент защиты маршрута AdminProtectedRoute */}
          <AdminProtectedRoute path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {showHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
