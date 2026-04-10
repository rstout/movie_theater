import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { BookingPage } from "./pages/BookingPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { api } from "./api/client";
import "./styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  // Auto-select first user on load
  useEffect(() => {
    api.getUsers().then((users) => {
      if (users.length > 0 && !userId) {
        setUserId(users[0].user_id);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout currentUserId={userId} onSelectUser={setUserId} />}>
            <Route index element={<HomePage />} />
            <Route path="movies/:movieId" element={<MovieDetailPage />} />
            <Route path="booking/:showId" element={<BookingPage userId={userId} />} />
            <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
            <Route path="confirmation/:bookingId/success" element={<PaymentSuccessPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
