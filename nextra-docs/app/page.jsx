"use client";

import React, { useState } from "react";

// Example of a custom React page inside Nextra
export default function DemoPage() {
  const [isShielded, setIsShielded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSimulate = () => {
    setLoading(true);
    // Simulate a 2-second ZK proof generation
    setTimeout(() => {
      setLoading(false);
      setIsShielded(true);
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Interactive Playground</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Test the UI components of the Privacy Protocol SDK directly in the
        browser.
      </p>

      {/* Interactive Card */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-white dark:bg-black shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold">Shield Assets</h2>
            <p className="text-sm text-gray-500">
              Simulate a client-side ZK proof generation.
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-mono ${
              isShielded
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            }`}
          >
            {isShielded ? "SHIELDED" : "PUBLIC"}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm mb-6 break-all">
          {loading ? (
            <span className="animate-pulse">
              Generating ZK Proof via Noir Circuits...
            </span>
          ) : isShielded ? (
            <span className="text-green-500">
              0x2a...9f8a (Encrypted Note) <br />
              Proof Validated. <br />
              Nullifier: 0x8b...21c
            </span>
          ) : (
            <span className="text-gray-400">
              // Click button to generate proof
            </span>
          )}
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading || isShielded}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isShielded
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
          }`}
        >
          {loading
            ? "Proving..."
            : isShielded
              ? "Transaction Complete"
              : "Simulate Shield"}
        </button>
      </div>
    </div>
  );
}
