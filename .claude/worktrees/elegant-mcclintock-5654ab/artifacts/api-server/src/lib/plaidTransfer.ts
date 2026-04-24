import {
  ACHClass,
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  TransferNetwork,
  TransferType,
} from "plaid";
import { randomUUID } from "crypto";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = (process.env.PLAID_ENV ?? "sandbox") as "sandbox" | "development" | "production";

export class PlaidTransferError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "PlaidTransferError";
    this.statusCode = statusCode;
  }
}

export function isPlaidTransferEnabled() {
  return Boolean(PLAID_CLIENT_ID && PLAID_SECRET);
}

export function getPlaidClient(): PlaidApi | null {
  if (!isPlaidTransferEnabled()) return null;

  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": PLAID_CLIENT_ID!,
          "PLAID-SECRET": PLAID_SECRET!,
        },
      },
    }),
  );
}

export async function authorizePlaidTransfer(params: {
  accessToken: string;
  accountId: string;
  amount: string;
  type: "credit" | "debit";
  legalName: string;
  emailAddress?: string;
  userId: string;
}) {
  const client = getPlaidClient();
  if (!client) {
    throw new PlaidTransferError("Plaid Transfer is not configured.");
  }

  const response = await client.transferAuthorizationCreate({
    access_token: params.accessToken,
    account_id: params.accountId,
    type: params.type === "credit" ? TransferType.Credit : TransferType.Debit,
    network: TransferNetwork.Ach,
    amount: params.amount,
    ach_class: ACHClass.Ppd,
    user: {
      legal_name: params.legalName,
      email_address: params.emailAddress,
    },
    idempotency_key: randomUUID().slice(0, 50),
    user_present: false,
  });

  const authorization = response.data.authorization;
  if (!authorization?.id) {
    throw new PlaidTransferError("Plaid did not return a transfer authorization.");
  }

  if (authorization.decision !== "approved") {
    throw new PlaidTransferError(
      authorization.decision_rationale?.description ??
        `Plaid transfer authorization ${authorization.decision}.`,
      400,
    );
  }

  return authorization;
}

export async function createPlaidTransfer(params: {
  accessToken: string;
  accountId: string;
  authorizationId: string;
  amount: string;
  type: "credit" | "debit";
  description: string;
  userId: string;
}) {
  const client = getPlaidClient();
  if (!client) {
    throw new PlaidTransferError("Plaid Transfer is not configured.");
  }

  const response = await client.transferCreate({
    access_token: params.accessToken,
    account_id: params.accountId,
    authorization_id: params.authorizationId,
    type: params.type === "credit" ? TransferType.Credit : TransferType.Debit,
    network: TransferNetwork.Ach,
    amount: params.amount,
    description: params.description.slice(0, 15),
    ach_class: ACHClass.Ppd,
    metadata: {
      user_id: params.userId,
    },
  });

  const transfer = response.data.transfer;
  if (!transfer?.id) {
    throw new PlaidTransferError("Plaid did not return a transfer ID.");
  }

  return transfer;
}

export async function getPlaidTransfer(transferId: string) {
  const client = getPlaidClient();
  if (!client) {
    throw new PlaidTransferError("Plaid Transfer is not configured.");
  }

  const response = await client.transferGet({
    transfer_id: transferId,
  });

  return response.data.transfer;
}

export function formatUsdFromCents(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

export function inferTransferStatus(transfer: { status?: string | null }) {
  return transfer.status ?? "unknown";
}

export function defaultTransferLegalName(userId: string) {
  return `BigBankBonus User ${userId}`.slice(0, 30);
}
