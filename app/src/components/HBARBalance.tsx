import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { HEDERA_TESTNET } from "../services/x402PaymentService";

interface HBARBalanceProps {
  client: any;
}

export default function HBARBalance({ client }: HBARBalanceProps) {
  const account = useActiveAccount();

  const { data: balanceData, isLoading } = useWalletBalance(
    {
      client,
      chain: HEDERA_TESTNET,
      address: account?.address,
    },
    {
      enabled: !!account?.address,
      refetchInterval: 10000,
    }
  );

  if (!account) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        color: "var(--color-text-secondary)"
      }}>
        Loading HBAR...
      </div>
    );
  }

  const displayBalance = balanceData?.displayValue ?? "0";
  const symbol = balanceData?.symbol ?? "HBAR";

  return (
    <div style={{
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "var(--color-text-primary)",
      background: "var(--color-bg-glass)",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--color-border-primary)",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    }}>
      <span>💵</span>
      <span>{displayBalance} {symbol}</span>
    </div>
  );
}
