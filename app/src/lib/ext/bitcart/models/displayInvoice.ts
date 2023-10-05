/**
 * Generated by orval v6.17.0 🍺
 * Do not edit manually.
 * BitcartCC
 * BitcartCC Merchants API
 * OpenAPI spec version: 0.7.4.1
 */
import type { DisplayInvoiceMetadata } from './displayInvoiceMetadata';
import type { DisplayInvoiceProductNames } from './displayInvoiceProductNames';
import type { DisplayInvoiceProducts } from './displayInvoiceProducts';

export interface DisplayInvoice {
  metadata?: DisplayInvoiceMetadata;
  created?: string;
  price: string;
  store_id?: string;
  currency?: string;
  paid_currency?: string;
  sent_amount: string;
  order_id?: string;
  notification_url?: string;
  redirect_url?: string;
  buyer_email?: string;
  promocode?: string;
  shipping_address?: string;
  notes?: string;
  discount?: string;
  status?: string;
  exception_status?: string;
  products?: DisplayInvoiceProducts;
  tx_hashes?: string[];
  expiration: number;
  id?: string;
  user_id: string;
  time_left: number;
  expiration_seconds: number;
  product_names: DisplayInvoiceProductNames;
  payments?: unknown[];
  refund_id?: string;
}
