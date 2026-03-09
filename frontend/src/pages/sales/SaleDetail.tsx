import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import type { Sale } from '../../types';
import toast from 'react-hot-toast';

// Generate ZATCA-compliant TLV QR code (Base64 encoded)
function generateZatcaQr(sale: Sale): string {
  const encoder = new TextEncoder();
  function tlv(tag: number, value: string): Uint8Array {
    const valueBytes = encoder.encode(value);
    const result = new Uint8Array(2 + valueBytes.length);
    result[0] = tag;
    result[1] = valueBytes.length;
    result.set(valueBytes, 2);
    return result;
  }
  const parts = [
    tlv(1, sale.branch?.name ?? ''),
    tlv(2, sale.branch?.vat_number ?? ''),
    tlv(3, new Date(sale.created_at).toISOString()),
    tlv(4, Number(sale.total).toFixed(2)),
    tlv(5, Number(sale.tax_amount).toFixed(2)),
  ];
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) { combined.set(p, offset); offset += p.length; }
  let binary = '';
  for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i]);
  return btoa(binary);
}

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sales/${id}`)
      .then((res) => setSale(res.data.data))
      .catch(() => toast.error('خطأ في تحميل الفاتورة'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('هل تريد إلغاء هذه الفاتورة؟')) return;
    try {
      await api.post(`/sales/${id}/cancel`);
      toast.success('تم إلغاء الفاتورة');
      setSale((prev) => prev ? { ...prev, status: 'cancelled' } : null);
    } catch {
      toast.error('خطأ في إلغاء الفاتورة');
    }
  };

  const printStyles = `
    @media print {
      @page { margin: 0; }
      body * { visibility: hidden; }
      #invoice, #invoice * { visibility: visible; }
      #invoice {
        position: absolute;
        top: 0; left: 0; right: 0;
        padding-top: 1cm;
        padding-bottom: 2cm;
        padding-left: 0.5cm;
        padding-right: 0.5cm;
        font-family: 'Arial', 'Tahoma', sans-serif !important;
        font-size: 10.5pt !important;
        color: #000 !important;
      }
      #invoice * { color: #000 !important; }
      #invoice table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      #invoice table th,
      #invoice table td {
        border: 1px solid #000 !important;
        padding: 3px 5px !important;
      }
      #invoice .totals-table {
        width: 55% !important;
      }
      .no-print { display: none !important; }
      #invoice input {
        border: none !important;
        outline: none !important;
        background: transparent !important;
        padding: 0 !important;
        width: 100% !important;
      }
      #invoice .print-hide-footer {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        overflow: hidden !important;
      }
    }
  `;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!sale) return <p className="text-center text-gray-400 py-12">الفاتورة غير موجودة</p>;

  const qrData = generateZatcaQr(sale);
  const saleDate = new Date(sale.created_at);
  const dateStr = saleDate.toLocaleDateString('en-US');
  const timeStr = saleDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Totals calculations
  const subtotalBeforeDiscount = Number(sale.subtotal) + Number(sale.discount);
  const discount = Number(sale.discount);
  const taxAmount = Number(sale.tax_amount);
  const total = Number(sale.total);

  // Payment breakdown
  const paidCash = sale.payment_method === 'cash' ? total : 0;
  const paidCard = (sale.payment_method === 'card' || sale.payment_method === 'bank_transfer') ? total : 0;
  const remaining = sale.payment_method === 'credit' ? total : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <style>{printStyles}</style>

      {/* Actions bar */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => navigate('/sales')} className="text-gray-600 hover:text-gray-800">
          &rarr; العودة للمبيعات
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            طباعة
          </button>
          {sale.status === 'completed' && (
            <button onClick={handleCancel}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium">
              إلغاء الفاتورة
            </button>
          )}
        </div>
      </div>

      {/* Invoice */}
      <div id="invoice" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" dir="rtl">

        {/* Title row — QR on left, company info + invoice title on right */}
        <div className="flex items-stretch border-t border-l border-r border-black mb-0">
          <div className="flex-1 p-2 border-l border-black flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-500">فاتورة ضريبية مبسطة</p>
              <p className="font-bold text-sm">فاتورة مبيعات كاش رقم : {sale.invoice_number}</p>
            </div>
            <div className="mt-2 text-sm space-y-0.5">
              <p className="font-bold">{sale.branch?.name || '-'}</p>
              <p className="text-xs">الرقم الضريبي للمنشأة : {sale.branch?.vat_number || '-'}</p>
              <p className="text-xs">{sale.branch?.address || '-'}</p>
            </div>
          </div>
          <div className="p-2 flex-shrink-0 flex items-center justify-center">
            <QRCodeSVG value={qrData} size={130} level="M" marginSize={2} />
          </div>
        </div>

        {/* Customer info table */}
        <table className="w-full border-collapse text-sm" style={{ borderTop: 'none' }}>
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold">
                اسم العميل : {sale.customer?.name || 'عميل نقدي'}
              </td>
              <td className="border border-black p-1 text-center">
                الجوال : {sale.customer?.phone || '-'}
              </td>
              <td className="border border-black p-1 text-center">
                التاريخ : {dateStr}
              </td>
              <td className="border border-black p-1 text-center w-16">
                {timeStr}
              </td>
            </tr>
            <tr>
              <td className="border border-black p-1">
                الرقم الضريبي للعميل : {sale.customer?.vat_number || ''}
              </td>
              <td className="border border-black p-1 text-center" colSpan={3}>
                العنوان : {sale.customer?.address || '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items table */}
        <table className="w-full border-collapse text-sm mt-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-center" style={{width:'2rem'}}>م</th>
              <th className="border border-black p-1 text-center" style={{minWidth:'5rem'}}>باركود</th>
              <th className="border border-black p-1 text-right" style={{minWidth:'8rem'}}>اسم الصنف</th>
              <th className="border border-black p-1 text-center whitespace-nowrap" style={{minWidth:'3.5rem'}}>الكمية</th>
              <th className="border border-black p-1 text-center whitespace-nowrap" style={{minWidth:'3.5rem'}}>السعر</th>
              <th className="border border-black p-1 text-center whitespace-nowrap" style={{minWidth:'5rem'}}>الإجمالي قبل الضريبة</th>
              <th className="border border-black p-1 text-center whitespace-nowrap" style={{minWidth:'5rem'}}>ضريبة القيمة المضافة</th>
              <th className="border border-black p-1 text-center whitespace-nowrap" style={{minWidth:'3.5rem'}}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, i) => {
              const itemSubtotal = Number(item.total) - Number(item.tax_amount);
              const itemTax = Number(item.tax_amount);
              const itemTotal = Number(item.total);
              return (
              <tr key={item.id}>
                <td className="border border-black p-1 text-center">{i + 1}</td>
                <td className="border border-black p-1 text-center">{item.product?.barcode || '-'}</td>
                <td className="border border-black p-1">{item.product_name}</td>
                <td className="border border-black p-1 text-center">{item.quantity}</td>
                <td className="border border-black p-1 text-center">{Number(item.unit_price).toFixed(2)}</td>
                <td className="border border-black p-1 text-center">{itemSubtotal.toFixed(2)}</td>
                <td className="border border-black p-1 text-center">{itemTax.toFixed(2)}</td>
                <td className="border border-black p-1 text-center font-bold">{itemTotal.toFixed(2)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals table */}
        <table className="totals-table border-collapse text-sm mt-3 w-3/5">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold">الإجمالي قبل الخصم :</td>
              <td className="border border-black p-1 text-center w-24">{subtotalBeforeDiscount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">الخصم :</td>
              <td className="border border-black p-1 text-center">{discount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">ضريبة القيمة المضافة 15 % :</td>
              <td className="border border-black p-1 text-center">{taxAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">الإجمالي شامل الضريبة :</td>
              <td className="border border-black p-1 text-center font-bold">{total.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">المدفوع نقداً :</td>
              <td className="border border-black p-1 text-center">{paidCash.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">المدفوع شبكة :</td>
              <td className="border border-black p-1 text-center">{paidCard.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature line */}
        <div className="flex justify-between mt-10 text-sm font-bold">
          <div className="text-right" style={{ marginLeft: '2cm' }}>
            <span>المستلم /</span>
          </div>
          <div className="text-right" style={{ marginRight: '1cm' }}>
            <span>البائع /</span>
          </div>
        </div>

        {/* Footer - hidden on print (pre-printed on paper) */}
        <div className="print-hide-footer mt-6 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          <p>شكراً لتعاملكم معنا</p>
          <p className="mt-1">KarajaERP - نظام إدارة الأعمال</p>
        </div>
      </div>
    </div>
  );
}
