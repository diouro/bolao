import { Badge } from "@/components/ui";

const fifaToIso: Record<string, string> = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb",
  SEN: "sn",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

export function CountryFlag({
  code,
  slot,
  className,
}: {
  code?: string | null;
  slot?: string | null;
  className?: string;
}) {
  const iso = code ? fifaToIso[code] : null;

  if (!iso) {
    return (
      <span className="inline-flex shrink-0">
        <Badge className="min-h-10 items-center rounded-xl bg-zinc-200 px-3 py-2 text-zinc-600 shadow-sm ring-1 ring-zinc-200">
          {slot ?? "TBD"}
        </Badge>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${iso}.svg`}
      alt={`${code} flag`}
      className={className ?? "h-8 w-11 rounded-md object-cover shadow-sm"}
      loading="lazy"
    />
  );
}
