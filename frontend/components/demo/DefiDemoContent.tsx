"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, Info } from "lucide-react";
import Faucet from "./Faucet";

export default function DefiDemoContent() {
  const [tokenIn, setTokenIn] = useState("ETH");
  const [tokenOut, setTokenOut] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");

  return (
    <div className="space-y-5">
      <Card className="border-border/50 bg-background/40 w-full max-w-md shadow-2xl backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle>Swap Tokens</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-background/50 border-border/50 space-y-2 rounded-xl border p-4">
            <div className="text-muted-foreground flex justify-between text-sm">
              <Label>Pay</Label>
              <span>Balance: 0.00</span>
            </div>

            <div className="flex items-center gap-4">
              <Input
                className="placeholder:text-muted-foreground/50 h-auto w-full border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
                placeholder="0.0"
                value={amountIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmountIn(e.target.value)
                }
              />

              <Select value={tokenIn} onValueChange={setTokenIn}>
                <SelectTrigger className="bg-background/50 border-border/50 w-[110px] rounded-full font-medium">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                  <SelectItem value="WBTC">WBTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-muted-foreground text-xs">≈ $0.00</div>
          </div>

          <div className="relative z-10 -my-2 flex items-center justify-center">
            <div className="bg-background border-border/50 text-muted-foreground rounded-xl border p-2">
              <ArrowDown size={16} />
            </div>
          </div>

          <div className="bg-background/50 border-border/50 space-y-2 rounded-xl border p-4">
            <div className="text-muted-foreground flex justify-between text-sm">
              <Label>Receive</Label>
              <span>Balance: 0.00</span>
            </div>
            <div className="flex items-center gap-4">
              <Input
                className="placeholder:text-muted-foreground/50 h-auto w-full border-none bg-transparent p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
                placeholder="0.0"
                readOnly
                value={amountIn} // Mock calculation for now
              />
              <Select value={tokenOut} onValueChange={setTokenOut}>
                <SelectTrigger className="bg-background/50 border-border/50 w-[110px] rounded-full font-medium">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                  <SelectItem value="WBTC">WBTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-muted-foreground text-xs">≈ $0.00</div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-muted-foreground flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span>Privacy Fee</span>
                <Info size={12} />
              </div>
              <span>0.1%</span>
            </div>
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Relayer Fee</span>
              <span>0.001 ETH</span>
            </div>
          </div>

          <Button className="mt-4 h-12 w-full text-lg font-semibold">
            Swap
          </Button>
        </CardContent>
      </Card>

      <Faucet />
    </div>
  );
}
