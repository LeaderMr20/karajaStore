<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\ZatcaLog;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class ZatcaService
{
    private string $apiUrl;
    private bool $isProduction;

    public function __construct()
    {
        $this->apiUrl = config('app.zatca_api_url', 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal');
        $this->isProduction = config('app.zatca_env', 'sandbox') === 'production';
    }

    /**
     * Process a sale for ZATCA compliance
     */
    public function processSale(Sale $sale): ZatcaLog
    {
        $uuid = Str::uuid()->toString();
        $sale->update(['zatca_uuid' => $uuid]);

        // Generate XML
        $xml = $this->generateXml($sale, $uuid);

        // Generate hash
        $hash = $this->generateInvoiceHash($xml);

        // Generate QR Code
        $qrCode = $this->generateQrCode($sale);

        // Create log entry
        $log = ZatcaLog::create([
            'sale_id' => $sale->id,
            'uuid' => $uuid,
            'invoice_hash' => $hash,
            'xml_content' => $xml,
            'qr_code' => $qrCode,
            'status' => 'pending',
        ]);

        // Submit to ZATCA
        try {
            $response = $this->submitToZatca($sale, $xml, $hash);

            $status = $sale->invoice_type === 'simplified' ? 'reported' : 'cleared';

            $log->update([
                'status' => $status,
                'response' => json_encode($response),
            ]);

            $sale->update(['zatca_status' => $status]);

        } catch (\Exception $e) {
            $log->update([
                'status' => 'error',
                'error_message' => $e->getMessage(),
            ]);

            $sale->update(['zatca_status' => 'error']);
        }

        return $log;
    }

    /**
     * Generate UBL 2.1 XML for invoice
     */
    public function generateXml(Sale $sale, string $uuid): string
    {
        $sale->load('items', 'branch', 'customer');
        $branch = $sale->branch;
        $customer = $sale->customer;
        $items = $sale->items;

        $issueDate = $sale->created_at->format('Y-m-d');
        $issueTime = $sale->created_at->format('H:i:s');

        $invoiceTypeCode = $sale->invoice_type === 'simplified' ? '0200000' : '0100000';
        $typeCode = $sale->invoice_type === 'simplified' ? '388' : '388';

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"';
        $xml .= ' xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"';
        $xml .= ' xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"';
        $xml .= ' xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">';
        $xml .= "\n";

        // Extensions (for digital signature)
        $xml .= '  <ext:UBLExtensions>';
        $xml .= '    <ext:UBLExtension>';
        $xml .= '      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>';
        $xml .= '      <ext:ExtensionContent>';
        $xml .= '        <!-- Digital Signature Placeholder -->';
        $xml .= '      </ext:ExtensionContent>';
        $xml .= '    </ext:UBLExtension>';
        $xml .= '  </ext:UBLExtensions>';

        // Profile & ID
        $xml .= "  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>\n";
        $xml .= "  <cbc:ID>{$sale->invoice_number}</cbc:ID>\n";
        $xml .= "  <cbc:UUID>{$uuid}</cbc:UUID>\n";
        $xml .= "  <cbc:IssueDate>{$issueDate}</cbc:IssueDate>\n";
        $xml .= "  <cbc:IssueTime>{$issueTime}</cbc:IssueTime>\n";
        $xml .= "  <cbc:InvoiceTypeCode name=\"{$invoiceTypeCode}\">{$typeCode}</cbc:InvoiceTypeCode>\n";
        $xml .= "  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>\n";
        $xml .= "  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>\n";

        // Supplier (Seller)
        $xml .= "  <cac:AccountingSupplierParty>\n";
        $xml .= "    <cac:Party>\n";
        $xml .= "      <cac:PartyIdentification>\n";
        $xml .= "        <cbc:ID schemeID=\"CRN\">{$branch->cr_number}</cbc:ID>\n";
        $xml .= "      </cac:PartyIdentification>\n";
        $xml .= "      <cac:PostalAddress>\n";
        $xml .= "        <cbc:StreetName>{$branch->address}</cbc:StreetName>\n";
        $xml .= "        <cbc:CityName>{$branch->location}</cbc:CityName>\n";
        $xml .= "        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>\n";
        $xml .= "      </cac:PostalAddress>\n";
        $xml .= "      <cac:PartyTaxScheme>\n";
        $xml .= "        <cbc:CompanyID>{$branch->vat_number}</cbc:CompanyID>\n";
        $xml .= "        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n";
        $xml .= "      </cac:PartyTaxScheme>\n";
        $xml .= "      <cac:PartyLegalEntity>\n";
        $xml .= "        <cbc:RegistrationName>{$branch->name}</cbc:RegistrationName>\n";
        $xml .= "      </cac:PartyLegalEntity>\n";
        $xml .= "    </cac:Party>\n";
        $xml .= "  </cac:AccountingSupplierParty>\n";

        // Customer (Buyer) - for standard invoices
        if ($sale->invoice_type === 'standard' && $customer) {
            $xml .= "  <cac:AccountingCustomerParty>\n";
            $xml .= "    <cac:Party>\n";
            $xml .= "      <cac:PostalAddress>\n";
            $xml .= "        <cbc:StreetName>" . ($customer->address ?? '') . "</cbc:StreetName>\n";
            $xml .= "        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>\n";
            $xml .= "      </cac:PostalAddress>\n";
            if ($customer->vat_number) {
                $xml .= "      <cac:PartyTaxScheme>\n";
                $xml .= "        <cbc:CompanyID>{$customer->vat_number}</cbc:CompanyID>\n";
                $xml .= "        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n";
                $xml .= "      </cac:PartyTaxScheme>\n";
            }
            $xml .= "      <cac:PartyLegalEntity>\n";
            $xml .= "        <cbc:RegistrationName>{$customer->name}</cbc:RegistrationName>\n";
            $xml .= "      </cac:PartyLegalEntity>\n";
            $xml .= "    </cac:Party>\n";
            $xml .= "  </cac:AccountingCustomerParty>\n";
        }

        // Payment means
        $paymentCode = match($sale->payment_method) {
            'cash' => '10',
            'card' => '48',
            'bank_transfer' => '42',
            default => '1',
        };
        $xml .= "  <cac:PaymentMeans>\n";
        $xml .= "    <cbc:PaymentMeansCode>{$paymentCode}</cbc:PaymentMeansCode>\n";
        $xml .= "  </cac:PaymentMeans>\n";

        // Discount at invoice level
        if ($sale->discount > 0) {
            $xml .= "  <cac:AllowanceCharge>\n";
            $xml .= "    <cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n";
            $xml .= "    <cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason>\n";
            $xml .= "    <cbc:Amount currencyID=\"SAR\">" . number_format($sale->discount, 2, '.', '') . "</cbc:Amount>\n";
            $xml .= "  </cac:AllowanceCharge>\n";
        }

        // Tax Total
        $xml .= "  <cac:TaxTotal>\n";
        $xml .= "    <cbc:TaxAmount currencyID=\"SAR\">" . number_format($sale->tax_amount, 2, '.', '') . "</cbc:TaxAmount>\n";
        $xml .= "    <cac:TaxSubtotal>\n";
        $xml .= "      <cbc:TaxableAmount currencyID=\"SAR\">" . number_format($sale->subtotal, 2, '.', '') . "</cbc:TaxableAmount>\n";
        $xml .= "      <cbc:TaxAmount currencyID=\"SAR\">" . number_format($sale->tax_amount, 2, '.', '') . "</cbc:TaxAmount>\n";
        $xml .= "      <cac:TaxCategory>\n";
        $xml .= "        <cbc:ID>S</cbc:ID>\n";
        $xml .= "        <cbc:Percent>15.00</cbc:Percent>\n";
        $xml .= "        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n";
        $xml .= "      </cac:TaxCategory>\n";
        $xml .= "    </cac:TaxSubtotal>\n";
        $xml .= "  </cac:TaxTotal>\n";

        // Legal Monetary Total
        $xml .= "  <cac:LegalMonetaryTotal>\n";
        $xml .= "    <cbc:LineExtensionAmount currencyID=\"SAR\">" . number_format($sale->subtotal, 2, '.', '') . "</cbc:LineExtensionAmount>\n";
        $xml .= "    <cbc:TaxExclusiveAmount currencyID=\"SAR\">" . number_format($sale->subtotal - $sale->discount, 2, '.', '') . "</cbc:TaxExclusiveAmount>\n";
        $xml .= "    <cbc:TaxInclusiveAmount currencyID=\"SAR\">" . number_format($sale->total, 2, '.', '') . "</cbc:TaxInclusiveAmount>\n";
        $xml .= "    <cbc:AllowanceTotalAmount currencyID=\"SAR\">" . number_format($sale->discount, 2, '.', '') . "</cbc:AllowanceTotalAmount>\n";
        $xml .= "    <cbc:PayableAmount currencyID=\"SAR\">" . number_format($sale->total, 2, '.', '') . "</cbc:PayableAmount>\n";
        $xml .= "  </cac:LegalMonetaryTotal>\n";

        // Invoice Lines
        foreach ($items as $index => $item) {
            $lineNumber = $index + 1;
            $lineAmount = number_format($item->unit_price * $item->quantity - $item->discount, 2, '.', '');

            $xml .= "  <cac:InvoiceLine>\n";
            $xml .= "    <cbc:ID>{$lineNumber}</cbc:ID>\n";
            $xml .= "    <cbc:InvoicedQuantity unitCode=\"PCE\">{$item->quantity}</cbc:InvoicedQuantity>\n";
            $xml .= "    <cbc:LineExtensionAmount currencyID=\"SAR\">{$lineAmount}</cbc:LineExtensionAmount>\n";

            if ($item->discount > 0) {
                $xml .= "    <cac:AllowanceCharge>\n";
                $xml .= "      <cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n";
                $xml .= "      <cbc:AllowanceChargeReason>Line Discount</cbc:AllowanceChargeReason>\n";
                $xml .= "      <cbc:Amount currencyID=\"SAR\">" . number_format($item->discount, 2, '.', '') . "</cbc:Amount>\n";
                $xml .= "    </cac:AllowanceCharge>\n";
            }

            $xml .= "    <cac:TaxTotal>\n";
            $xml .= "      <cbc:TaxAmount currencyID=\"SAR\">" . number_format($item->tax_amount, 2, '.', '') . "</cbc:TaxAmount>\n";
            $xml .= "      <cbc:RoundingAmount currencyID=\"SAR\">" . number_format($item->total, 2, '.', '') . "</cbc:RoundingAmount>\n";
            $xml .= "    </cac:TaxTotal>\n";

            $xml .= "    <cac:Item>\n";
            $xml .= "      <cbc:Name>{$item->product_name}</cbc:Name>\n";
            $xml .= "      <cac:ClassifiedTaxCategory>\n";
            $xml .= "        <cbc:ID>S</cbc:ID>\n";
            $xml .= "        <cbc:Percent>" . number_format($item->tax_rate, 2, '.', '') . "</cbc:Percent>\n";
            $xml .= "        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n";
            $xml .= "      </cac:ClassifiedTaxCategory>\n";
            $xml .= "    </cac:Item>\n";

            $xml .= "    <cac:Price>\n";
            $xml .= "      <cbc:PriceAmount currencyID=\"SAR\">" . number_format($item->unit_price, 2, '.', '') . "</cbc:PriceAmount>\n";
            $xml .= "    </cac:Price>\n";
            $xml .= "  </cac:InvoiceLine>\n";
        }

        $xml .= "</Invoice>";

        return $xml;
    }

    /**
     * Generate invoice hash (SHA-256)
     */
    public function generateInvoiceHash(string $xml): string
    {
        return base64_encode(hash('sha256', $xml, true));
    }

    /**
     * Generate QR Code in TLV format (Tag-Length-Value)
     * Tags: 1=Seller, 2=VAT Number, 3=Timestamp, 4=Total, 5=Tax, 6=Hash, 7=Signature, 8=Public Key
     */
    public function generateQrCode(Sale $sale): string
    {
        $sale->load('branch');

        $tlv = '';
        $tlv .= $this->tlvEncode(1, $sale->branch->name); // Seller name
        $tlv .= $this->tlvEncode(2, $sale->branch->vat_number ?? ''); // VAT number
        $tlv .= $this->tlvEncode(3, $sale->created_at->toIso8601String()); // Timestamp
        $tlv .= $this->tlvEncode(4, number_format($sale->total, 2, '.', '')); // Total with VAT
        $tlv .= $this->tlvEncode(5, number_format($sale->tax_amount, 2, '.', '')); // VAT amount

        return base64_encode($tlv);
    }

    /**
     * TLV encoding helper
     */
    private function tlvEncode(int $tag, string $value): string
    {
        $valueBytes = mb_convert_encoding($value, 'UTF-8');
        $length = strlen($valueBytes);

        return chr($tag) . chr($length) . $valueBytes;
    }

    /**
     * Submit invoice to ZATCA API
     */
    public function submitToZatca(Sale $sale, string $xml, string $hash): array
    {
        $config = $sale->branch->zatcaConfig ?? null;

        if (!$config) {
            throw new \Exception('لم يتم إعداد ZATCA لهذا الفرع');
        }

        $endpoint = $sale->invoice_type === 'simplified'
            ? '/invoices/reporting/single'
            : '/invoices/clearance/single';

        $response = Http::withHeaders([
            'Accept-Language' => 'ar',
            'Accept-Version' => 'V2',
            'Content-Type' => 'application/json',
        ])->withBasicAuth(
            $config->compliance_csid ?? '',
            $config->production_csid ?? ''
        )->post($this->apiUrl . $endpoint, [
            'invoiceHash' => $hash,
            'uuid' => $sale->zatca_uuid,
            'invoice' => base64_encode($xml),
        ]);

        if (!$response->successful()) {
            throw new \Exception('ZATCA API Error: ' . $response->body());
        }

        return $response->json();
    }
}
