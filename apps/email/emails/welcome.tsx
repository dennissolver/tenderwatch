import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
  companyName?: string;
}

export default function WelcomeEmail({
  userName = "there",
  companyName
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to TenderWatch - Let's find your next contract</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to TenderWatch! 🎉</Heading>

          <Text style={text}>
            Hi {userName},
          </Text>

          <Text style={text}>
            {companyName
              ? `Great to have ${companyName} on board!`
              : "Great to have you on board!"
            } You've just taken the first step towards never missing a relevant government tender again.
          </Text>

          <Section style={buttonContainer}>
            <Link
              href="https://tenderwatch.io/dashboard"
              style={button}
            >
              Go to Dashboard
            </Link>
          </Section>

          <Text style={text}>
            <strong>Here's what to do next:</strong>
          </Text>

          <Text style={text}>
            1. <strong>Create your first Watch</strong> - Tell us what you're looking for with keywords and filters
          </Text>

          <Text style={text}>
            2. <strong>Link your accounts</strong> - Connect your AusTender, state portals, or VendorPanel accounts
          </Text>

          <Text style={text}>
            3. <strong>Sit back</strong> - We'll scan every portal and email you when we find matches
          </Text>

          <Text style={text}>
            Questions? Just reply to this email - we're here to help.
          </Text>

          <Text style={footer}>
            — The TenderWatch Team
          </Text>
        </Container>
      </Body>
    </Html>
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
  maxWidth: "560px"
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  marginBottom: "24px"
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "1.5",
  marginBottom: "16px"
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px"
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
  fontSize: "14px",
  marginTop: "32px"
};
