import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components";
import * as React from "react";

interface TenderMatch {
  id: string;
  title: string;
  buyerOrg: string;
  closesAt: string;
  tier: "strong" | "maybe" | "stretch";
  summary: string;
  url: string;
}

interface DigestEmailProps {
  userName: string;
  matches: TenderMatch[];
  watchName: string;
  date: string;
}

export default function DigestEmail({
  userName = "there",
  matches = [],
  watchName = "My Watch",
  date = new Date().toLocaleDateString()
}: DigestEmailProps) {
  const strongMatches = matches.filter(m => m.tier === "strong");
  const maybeMatches = matches.filter(m => m.tier === "maybe");

  return (
    <Html>
      <Head />
      <Preview>
        {matches.length} new tender{matches.length !== 1 ? "s" : ""} matching "{watchName}"
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Tender Digest</Heading>

          <Text style={text}>
            Hi {userName}, here's what we found for <strong>"{watchName}"</strong> today.
          </Text>

          {strongMatches.length > 0 && (
            <Section>
              <Heading as="h2" style={h2}>
                🎯 Strong Matches ({strongMatches.length})
              </Heading>
              {strongMatches.map(match => (
                <TenderCard key={match.id} match={match} />
              ))}
            </Section>
          )}

          {maybeMatches.length > 0 && (
            <Section>
              <Hr style={hr} />
              <Heading as="h2" style={h2}>
                🤔 Worth a Look ({maybeMatches.length})
              </Heading>
              {maybeMatches.map(match => (
                <TenderCard key={match.id} match={match} />
              ))}
            </Section>
          )}

          {matches.length === 0 && (
            <Text style={text}>
              No new matches today. We'll keep looking!
            </Text>
          )}

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Link
              href="https://tenderwatch.io/dashboard"
              style={button}
            >
              View All Matches
            </Link>
          </Section>

          <Text style={footer}>
            You're receiving this because you have a Watch set up on TenderWatch.
            <br />
            <Link href="https://tenderwatch.io/settings/notifications" style={footerLink}>
              Manage notifications
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function TenderCard({ match }: { match: TenderMatch }) {
  return (
    <Section style={card}>
      <Link href={match.url} style={cardTitle}>
        {match.title}
      </Link>
      <Text style={cardMeta}>
        {match.buyerOrg} • Closes {match.closesAt}
      </Text>
      <Text style={cardSummary}>{match.summary}</Text>
    </Section>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px"
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  marginBottom: "16px"
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  marginTop: "24px",
  marginBottom: "16px"
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "1.5"
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0"
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px"
};

const cardTitle = {
  color: "#2563eb",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none"
};

const cardMeta = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0 8px"
};

const cardSummary = {
  color: "#4a4a4a",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "0"
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "24px"
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none"
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "32px",
  textAlign: "center" as const
};

const footerLink = {
  color: "#8898aa"
};
