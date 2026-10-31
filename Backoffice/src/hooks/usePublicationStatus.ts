import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPublicationStatus } from '@/services/api/endpoints/publication';
import { subscribePublicationStatus } from '@/services/realtime/publicationStatus';

/** État de publication du site (cache partagé par la navbar et le tableau de bord). */
export function usePublicationStatus() {
  return useQuery({
    queryKey: ['publication', 'current'],
    queryFn: getPublicationStatus,
    staleTime: 10_000,
  });
}

/** Abonnement SSE unique, monté avec la coque applicative. */
export function usePublicationStream() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribePublicationStatus(() => {
        void queryClient.invalidateQueries({ queryKey: ['publication'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }),
    [queryClient],
  );
}
