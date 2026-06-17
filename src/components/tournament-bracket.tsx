import type { ReactNode } from "react";
import { BracketMatchCell } from "@/components/bracket-match-cell";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import {
  bracketDisplayRounds,
  getBracketHalfMatches,
  getBracketRowSpan,
  getBracketRowStart,
  getFinalMatch,
  getThirdPlaceMatch,
  type BracketDisplayRound,
} from "@/lib/tournament/knockout-bracket";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

const BRACKET_ROW_COUNT = 16;
const BRACKET_ROW_HEIGHT_REM = 5;
const BRACKET_COLUMN_WIDTH_REM = 13;
const BRACKET_LABEL_HEIGHT = "2.5rem";
const bracketGridStyle = {
  gridTemplateRows: `repeat(${BRACKET_ROW_COUNT}, ${BRACKET_ROW_HEIGHT_REM}rem)`,
} as const;

const roundLabelKeys: Record<BracketDisplayRound | "third_place", TranslationKey> =
  {
    round_of_32: "round.round_of_32",
    round_of_16: "round.round_of_16",
    quarter_final: "round.quarter_final",
    semi_final: "round.semi_final",
    final: "round.final",
    third_place: "round.third_place",
  };

export function TournamentBracket({
  matches,
  locale,
}: {
  matches: Match[];
  locale: Locale;
}) {
  const finalMatch = getFinalMatch(matches);
  const thirdPlaceMatch = getThirdPlaceMatch(matches);
  const leftRounds = bracketDisplayRounds.slice(0, 4);
  const rightRounds = [...bracketDisplayRounds].reverse().slice(1, 5);

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-semibold text-zinc-500 lg:hidden">
        {t(locale, "bracket.scrollHint")}
      </p>
      <div className="-mx-2 max-h-[calc(100dvh-10rem)] overflow-auto overscroll-contain px-2 pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="flex w-max min-w-full items-start">
          {leftRounds.flatMap((round, index) => {
            const column = (
              <BracketColumn
                key={`left-col-${round}`}
                round={round}
                half="left"
                matches={matches}
                locale={locale}
              />
            );

            if (index === leftRounds.length - 1) {
              return [column, <BracketLineColumn key="left-final-line" />];
            }

            const pairCount =
              getBracketHalfMatches(round, "left", matches).length / 2;

            return [
              column,
              <BracketConnectorColumn
                key={`left-fork-${round}`}
                sourceRound={round}
                pairCount={pairCount}
              />,
            ];
          })}

          <FinalColumn
            finalMatch={finalMatch}
            thirdPlaceMatch={thirdPlaceMatch}
            locale={locale}
          />

          <BracketLineColumn mirrored />

          {rightRounds.flatMap((round, index) => {
            const column = (
              <BracketColumn
                key={`right-col-${round}`}
                round={round}
                half="right"
                matches={matches}
                locale={locale}
              />
            );

            if (index === rightRounds.length - 1) {
              return [column];
            }

            const pairCount =
              getBracketHalfMatches(round, "right", matches).length / 2;

            return [
              column,
              <BracketConnectorColumn
                key={`right-fork-${round}`}
                sourceRound={round}
                pairCount={pairCount}
                mirrored
              />,
            ];
          })}
        </div>
      </div>
    </div>
  );
}

function BracketGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 grid py-1" style={bracketGridStyle}>
      {children}
    </div>
  );
}

function FinalColumn({
  finalMatch,
  thirdPlaceMatch,
  locale,
}: {
  finalMatch: Match | null;
  thirdPlaceMatch: Match | null;
  locale: Locale;
}) {
  return (
    <div
      className="mx-1 flex shrink-0 flex-col"
      style={{ width: `${BRACKET_COLUMN_WIDTH_REM}rem` }}
    >
      <BracketRoundLabel round="final" locale={locale} highlight />
      <BracketGrid>
        {finalMatch && (
          <div
            className="flex items-center px-0.5"
            style={{ gridRow: "5 / span 8" }}
          >
            <BracketMatchCell
              match={finalMatch}
              locale={locale}
              highlight
              compact
              className="w-full"
            />
          </div>
        )}
        {thirdPlaceMatch && (
          <div
            className="flex flex-col justify-center gap-2 px-0.5"
            style={{ gridRow: "13 / span 4" }}
          >
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
              {t(locale, roundLabelKeys.third_place)}
            </p>
            <BracketMatchCell
              match={thirdPlaceMatch}
              locale={locale}
              compact
              className="w-full"
            />
          </div>
        )}
      </BracketGrid>
    </div>
  );
}

function BracketRoundLabel({
  round,
  locale,
  highlight = false,
}: {
  round: BracketDisplayRound | "final";
  locale: Locale;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.12em]",
        highlight
          ? "bg-zinc-950 text-white"
          : "bg-zinc-200 text-zinc-700",
      )}
      style={{ minHeight: BRACKET_LABEL_HEIGHT }}
    >
      {t(locale, roundLabelKeys[round])}
    </div>
  );
}

function BracketColumn({
  round,
  half,
  matches,
  locale,
}: {
  round: BracketDisplayRound;
  half: "left" | "right";
  matches: Match[];
  locale: Locale;
}) {
  const roundMatches = getBracketHalfMatches(round, half, matches);
  const rowSpan = getBracketRowSpan(round);

  return (
    <div
      className="mx-1 flex shrink-0 flex-col"
      style={{ width: `${BRACKET_COLUMN_WIDTH_REM}rem` }}
    >
      <BracketRoundLabel round={round} locale={locale} />
      <BracketGrid>
        {roundMatches.map((match, index) => (
          <div
            key={match.id}
            className="flex min-h-0 items-center px-0.5 py-0.5"
            style={{
              gridRow: `${getBracketRowStart(index, round)} / span ${rowSpan}`,
            }}
          >
            <BracketMatchCell
              match={match}
              locale={locale}
              compact
              className="w-full"
            />
          </div>
        ))}
      </BracketGrid>
    </div>
  );
}

function BracketConnectorColumn({
  sourceRound,
  pairCount,
  mirrored = false,
}: {
  sourceRound: BracketDisplayRound;
  pairCount: number;
  mirrored?: boolean;
}) {
  const sourceRowSpan = getBracketRowSpan(sourceRound);
  const forkRowSpan = sourceRowSpan * 2;

  return (
    <div className="flex shrink-0 flex-col" style={{ width: "1.5rem" }}>
      <div style={{ minHeight: BRACKET_LABEL_HEIGHT }} />
      <BracketGrid>
        {Array.from({ length: pairCount }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-0 items-stretch"
            style={{
              gridRow: `${index * forkRowSpan + 1} / span ${forkRowSpan}`,
            }}
          >
            <BracketFork mirrored={mirrored} />
          </div>
        ))}
      </BracketGrid>
    </div>
  );
}

function BracketLineColumn({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <div className="flex shrink-0 flex-col" style={{ width: "1.25rem" }}>
      <div style={{ minHeight: BRACKET_LABEL_HEIGHT }} />
      <BracketGrid>
        <div className="flex items-center" style={{ gridRow: "1 / span 16" }}>
          <BracketLine mirrored={mirrored} />
        </div>
      </BracketGrid>
    </div>
  );
}

function BracketFork({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <div
      className={cn(
        "relative h-full w-full",
        mirrored && "scale-x-[-1]",
      )}
      aria-hidden
    >
      <div className="absolute left-0 top-1/4 h-1/4 w-1/2 border-r border-t border-zinc-300" />
      <div className="absolute bottom-1/4 left-0 h-1/4 w-1/2 border-r border-b border-zinc-300" />
      <div className="absolute left-1/2 top-1/2 h-px w-1/2 -translate-y-1/2 bg-zinc-300" />
    </div>
  );
}

function BracketLine({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <div
      className={cn("h-px w-full bg-zinc-300", mirrored && "scale-x-[-1]")}
      aria-hidden
    />
  );
}
