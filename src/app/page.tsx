import { DuelBoard } from "@/components/duel/DuelBoard";
import { DuelProvider } from "@/components/providers/DuelProvider";

/**
 * The whole app is a client-side board — there is no backend and no data to
 * fetch, so this page is a thin shell around the provider and the board.
 */
export default function Home() {
  return (
    <DuelProvider>
      <main className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-4">
        <DuelBoard />
      </main>
    </DuelProvider>
  );
}
