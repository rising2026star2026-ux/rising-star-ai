import Home from "@/components/Home";
import { BRAND, SITE_DESCRIPTION } from "@/lib/site";

export const metadata = {
  title: { absolute: `${BRAND} | كل أدوات تجارتك في مكان واحد` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Home />;
}
