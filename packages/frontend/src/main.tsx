import { StrictMode, Suspense, lazy, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { api } from "./api/client";
import "./styles/global.css";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const MovieDetailPage = lazy(() =>
  import("./pages/MovieDetailPage").then((m) => ({ default: m.MovieDetailPage }))
);
const BookingPage = lazy(() =>
  import("./pages/BookingPage").then((m) => ({ default: m.BookingPage }))
);
const ConfirmationPage = lazy(() =>
  import("./pages/ConfirmationPage").then((m) => ({ default: m.ConfirmationPage }))
);
const PaymentSuccessPage = lazy(() =>
  import("./pages/PaymentSuccessPage").then((m) => ({ default: m.PaymentSuccessPage }))
);

// Warm up the API origin TCP/TLS before the first fetch.
const apiBase = import.meta.env.VITE_API_URL;
if (apiBase) {
  try {
    const origin = new URL(apiBase, window.location.href).origin;
    if (origin !== window.location.origin) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
  } catch {
    /* ignore malformed VITE_API_URL */
  }
}

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
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout currentUserId={userId} onSelectUser={setUserId} />}>
              <Route index element={<HomePage />} />
              <Route path="movies/:movieId" element={<MovieDetailPage />} />
              <Route path="booking/:showId" element={<BookingPage userId={userId} />} />
              <Route path="confirmation/:bookingId" element={<ConfirmationPage />} />
              <Route path="confirmation/:bookingId/success" element={<PaymentSuccessPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
