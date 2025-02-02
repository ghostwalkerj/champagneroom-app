/**
 * Generated by orval v6.17.0 🍺
 * Do not edit manually.
 * BitcartCC
 * BitcartCC Merchants API
 * OpenAPI spec version: 0.7.4.1
 */
import type { CreateInvoiceMetadata } from './createInvoiceMetadata';
import type { CreateInvoiceProducts } from './createInvoiceProducts';

export interface CreateInvoice {
  metadata?: CreateInvoiceMetadata;
  created?: string;
  price: number;
  store_id: string;
  currency?: string;
  paid_currency?: string;
  sent_amount?: number;
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
  products?: CreateInvoiceProducts;
  tx_hashes?: string[];
  expiration?: number;
}
