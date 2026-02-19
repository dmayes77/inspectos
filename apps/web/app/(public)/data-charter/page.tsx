import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DataCharterPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-20 pt-24 md:px-6">
      <Badge color="light" className="mb-4">Data Charter</Badge>
      <h1 className="text-4xl font-semibold tracking-tight">Your clients belong to you.</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        InspectOS is built on data sovereignty. We do not sell, market, or broker your customer relationships.
      </p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">1. Ownership</h2>
          <p className="mt-2 text-muted-foreground">
            You retain ownership of your business data, customer data, and operational records.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. No Data Brokerage</h2>
          <p className="mt-2 text-muted-foreground">
            InspectOS will never sell, rent, or broker your customer relationships or contact records.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Isolation by Business</h2>
          <p className="mt-2 text-muted-foreground">
            Data is isolated at the business level. One company cannot access another company’s data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Portability</h2>
          <p className="mt-2 text-muted-foreground">
            You can export your core business data in standard formats and maintain continuity on your terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Access and Accountability</h2>
          <p className="mt-2 text-muted-foreground">
            Access to sensitive data is permission-gated and logged for operational accountability.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </section>
  );
}
