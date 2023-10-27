/**
 * Generated by orval v6.17.0 🍺
 * Do not edit manually.
 * BitcartCC
 * BitcartCC Merchants API
 * OpenAPI spec version: 0.7.4.1
 */
import type { OptionalInvoiceMetadata } from './optionalInvoiceMetadata';
import type { OptionalInvoiceProducts } from './optionalInvoiceProducts';

export interface OptionalInvoice {
  metadata?: OptionalInvoiceMetadata;
  created?: string;
  price?: string;
  store_id?: string;
  currency?: string;
  paid_currency?: string;
  sent_amount?: string;
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
  products?: OptionalInvoiceProducts;
  tx_hashes?: string[];
  expiration?: number;
  id?: string;
  user_id?: string;
}