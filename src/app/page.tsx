"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getFeelzCatalog } from "@/lib/api";
import { queryKeys } from "@/lib/query/hooks";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ZostelLocationsSection } from "@/components/ZostelLocationsSection";
import { WhoItsForSection } from "@/components/WhoItsForSection";
import { StatsBar } from "@/components/StatsBar";
import { FaqSection } from "@/components/FaqSection";
import { HeadsUpSection } from "@/components/HeadsUpSection";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { LoginModal } from "@/components/LoginModal";
import { OrdersModal } from "@/components/OrdersModal";

const MOOD_ORDER = ["focus", "extrovert", "joy", "rest", "sleep"];

export default function Home() {
  const catalogQuery = useQuery({
    queryKey: queryKeys.feelzCatalog(),
    queryFn: () => getFeelzCatalog(createClient()),
  });
  // Brand order (focus, extrovert, joy, rest/sleep) rather than the
  // alphabetical order the DB query returns — matches the numbered
  // "no. 01 · feelz" labels on each card.
  const products = [...(catalogQuery.data ?? [])].sort(
    (a, b) => MOOD_ORDER.indexOf(a.name.toLowerCase()) - MOOD_ORDER.indexOf(b.name.toLowerCase()),
  );

  return (
    <>
      <Header />
      <Hero />

     

      <ZostelLocationsSection />

      <HowItWorksSection />

      <WhoItsForSection />

      <StatsBar />

      <FaqSection />
      <HeadsUpSection />
      <Footer />
      <CartDrawer />
      <LoginModal />
      <OrdersModal />
    </>
  );
}
