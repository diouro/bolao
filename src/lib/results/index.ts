import { getResultsProvider } from "@/lib/env";
import { FootballDataResultsProvider } from "@/lib/results/football-data";
import { ManualResultsProvider } from "@/lib/results/manual";
import type { ResultsProvider } from "@/lib/results/provider";

export function createResultsProvider(): ResultsProvider {
  if (getResultsProvider() === "football-data") {
    return new FootballDataResultsProvider();
  }

  return new ManualResultsProvider();
}
