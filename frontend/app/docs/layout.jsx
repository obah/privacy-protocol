import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export const metadata = {
  title: "Privacy Protocol Docs",
  description: "Developer and operator documentation for Privacy Protocol",
};

const navbar = <Navbar logo={<b>Privacy Protocol Docs</b>} />;
const footer = (
  <Footer>
    {new Date().getFullYear()} © Privacy Protocol. All rights reserved.
  </Footer>
);

export default async function DocsLayout({ children }) {
  return (
    <Layout navbar={navbar} pageMap={await getPageMap()} footer={footer}>
      {children}
    </Layout>
  );
}
