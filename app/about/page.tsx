import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="narrow prose">
      <h1>About UdyamSetu</h1>
      <p className="lead">
        UdyamSetu is an independent platform that helps startup founders domiciled in Jammu find incubation centres,
        apply to them, and get support from mentors and college experts.
      </p>

      <h2>What UdyamSetu does</h2>
      <ul>
        <li>Founders build one venture profile and can apply to as many centres as they like.</li>
        <li>We suggest centres that fit your stage, sector and support needs, and explain why. We never assign you to a centre.</li>
        <li>Every centre can find registered startups and start a private conversation. Your email and phone stay private unless you choose to share them.</li>
        <li>Centres list mentors and paid college experts. You pick an open time and send a request; the expert confirms it.</li>
      </ul>

      <h2 id="privacy">What UdyamSetu does not do</h2>
      <ul>
        <li>It is not a government portal and is not operated by any government scheme or mission.</li>
        <li>It does not promise funding, grants or admission. Each centre makes its own admission decisions.</li>
        <li>It does not take payments. Paid experts tell you how to pay them directly, and confirm your session themselves.</li>
        <li>It does not check domicile documents. You self-declare domicile when you register; proof may be asked for later by a funding body, outside UdyamSetu.</li>
      </ul>

      <h2 id="centres">Where the centre list comes from</h2>
      <p>
        The incubation centres listed are the ones named in public reports as part of the Mission YUVA incubation
        network in Jammu and Kashmir. Each centre&apos;s page links to its source. Listing a centre doesn&apos;t mean it has
        partnered with UdyamSetu: centres open applications here once their own staff join.
      </p>

      <p className="actions">
        <Link href="/register" className="btn btn-primary">
          Create a free account
        </Link>
        <Link href="/centres" className="btn btn-secondary">
          Browse centres
        </Link>
      </p>
    </section>
  );
}
