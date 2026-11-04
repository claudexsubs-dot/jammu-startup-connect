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
        <li>Centres list mentors and paid college experts. You can request a session; the expert confirms it.</li>
      </ul>

      <h2>What UdyamSetu does not do</h2>
      <ul>
        <li>It is not a government portal and is not operated by any government scheme or mission.</li>
        <li>It does not promise funding, grants or admission. Each centre makes its own admission decisions.</li>
        <li>It does not take payments. Paid experts tell you how to pay them directly, and confirm your session themselves.</li>
        <li>It does not check domicile documents. You self-declare domicile when you register; proof may be asked for later by a funding body, outside UdyamSetu.</li>
      </ul>

      <h2>Sample listings</h2>
      <p>
        Centres marked <span className="badge badge-sample">Sample listing</span> are fictional examples used to
        demonstrate the platform. They are not real organisations.
      </p>

      <p className="actions">
        <Link href="/register" className="btn btn-primary">
          Register as a founder
        </Link>
        <Link href="/centres" className="btn btn-secondary">
          Browse centres
        </Link>
      </p>
    </section>
  );
}
