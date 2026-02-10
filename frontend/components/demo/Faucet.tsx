"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Faucet() {
  return (
    <Card className="border-border/50 bg-background/40 mx-auto w-full max-w-lg shadow-2xl backdrop-blur-xl dark:border-green-100/50">
      <CardHeader>
        <CardTitle>Faucet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Enter your wallet address to claim tokens for swapping and voting"
          className="h-12 w-full"
        />
        <Button className="h-12 w-full">Claim</Button>
      </CardContent>
    </Card>
  );
}
