import { createHttpClient } from "@/utils/api/createHttpClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BillingSubscription,
  CheckoutResponse,
  PortalResponse,
} from "../data/schema";

const httpClient = createHttpClient();

export function useBilling() {
  const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery<BillingSubscription>({
    queryKey: ["billing", "subscription"],
    queryFn: () => httpClient.get("/api/billing/subscription"),
  });

  const { mutateAsync: createCheckout, isPending: isCheckoutLoading } =
    useMutation<CheckoutResponse, Error, { priceLookupKey: string }>({
      mutationFn: (data) => httpClient.post("/api/billing/checkout", data),
      onSuccess: (data) => {
        window.location.href = data.checkoutUrl;
      },
    });

  const { mutateAsync: createPortal, isPending: isPortalLoading } =
    useMutation<PortalResponse, Error, void>({
      mutationFn: () => httpClient.post("/api/billing/portal", {}),
      onSuccess: (data) => {
        window.location.href = data.portalUrl;
      },
    });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
    queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
  };

  return {
    subscription,
    isLoading,
    error,
    refetch,
    invalidate,
    invalidateAll,
    createCheckout,
    isCheckoutLoading,
    createPortal,
    isPortalLoading,
  };
}
