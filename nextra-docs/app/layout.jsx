import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export const metadata = {
  title: "Privacy Protocol Docs",
  description: "Developer and operator documentation for Privacy Protocol",
};

const banner = (
  <Banner storageKey="privacy-protocol-docs-banner">
    Privacy Protocol relayer flow is now default in the SDK.
  </Banner>
);
const navbar = (
  <Navbar
    logo={<b>Privacy Protocol Docs</b>}
  />
);
const footer = (
  <Footer>{new Date().getFullYear()} © Privacy Protocol. All rights reserved.</Footer>
);

export default async function RootLayout({ children }) {
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      suppressHydrationWarning
    >
      <Head />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
