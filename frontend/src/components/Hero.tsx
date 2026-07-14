interface HeroProps {
  pendingCount: number;
  totalStaked: string;
  confirmedCount: number;
}

export function Hero({ pendingCount, totalStaked, confirmedCount }: HeroProps) {
  return (
    <section className="border-b border-contour contour-bg">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="grid sm:grid-cols-[1.4fr,1fr] gap-10 items-end">
          <div>
            <p className="font-mono text-xs tracking-widest text-blaze uppercase mb-4">
              Filed · Corroborated · Trusted — nothing off-trail
            </p>
            <h1 className="font-display text-[2.6rem] sm:text-6xl leading-[1.02] tracking-tight">
              The trail report
              <br />
              <span className="italic text-pine-soft">only pays out</span>
              <br />
              once the crowd agrees.
            </h1>
            <p className="mt-5 max-w-md text-pine-soft leading-relaxed">
              Stake a small XLM deposit to file a trail condition. Other
              hikers corroborate or dispute it. Accurate reporters get
              their stake back plus a reward, and build a trust score
              other hikers can check before trusting a report.
            </p>
          </div>

          <dl className="grid grid-cols-3 sm:grid-cols-1 gap-4 sm:gap-3 sm:border-l sm:border-contour sm:pl-8">
            <StatRow label="Pending verification" value={pendingCount.toString()} accent="ember" />
            <StatRow label="Currently staked" value={`${totalStaked} XLM`} accent="blaze" />
            <StatRow label="Confirmed reports" value={confirmedCount.toString()} accent="creek" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "ember" | "blaze" | "creek";
}) {
  const accentClass = {
    ember: "text-ember",
    blaze: "text-blaze",
    creek: "text-creek",
  }[accent];

  return (
    <div>
      <dd className={`font-mono text-2xl sm:text-3xl font-medium ${accentClass}`}>{value}</dd>
      <dt className="text-xs text-pine-soft/70 mt-1">{label}</dt>
    </div>
  );
}
