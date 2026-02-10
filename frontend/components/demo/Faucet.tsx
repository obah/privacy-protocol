"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Faucet() {
  return (
    <Card className="border-border/50 bg-background/40 w-full max-w-md shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Faucet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Enter your wallet address to claim test tokens" />
        <Button className="w-full">Claim</Button>
      </CardContent>
    </Card>
  );
}
