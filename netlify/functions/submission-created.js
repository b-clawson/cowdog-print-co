// Netlify invokes this automatically for every form submission on the site
// (the "submission-created" filename is a Netlify convention, not a config choice).
// We only build a custom email for the order form; everything else is ignored
// so the homepage quote form keeps using Netlify's default notification.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.ORDER_FORM_TO_EMAIL || 'info@cowdogprint.co';
const FROM_EMAIL = process.env.ORDER_FORM_FROM_EMAIL || 'Cowdog Print Co. Orders <orders@cowdogprint.co>';

const ARTWORK_STATUS_LABELS = {
  provided: 'Artwork Provided',
  cowdog_has_artwork: 'Cowdog Has Artwork',
  design_needed: 'Design Work Needed',
  reorder: 'Reorder',
};

const DELIVERY_METHOD_LABELS = {
  pickup: 'Pickup at Cowdog Print Co.',
  shipping: 'Shipping',
  local_delivery: 'Local Delivery ($20 flat fee)',
};

const PRINT_LOCATION_LABELS = {
  left_chest: 'Left Chest',
  full_front: 'Full Front',
  full_back: 'Full Back',
  sleeve: 'Sleeve',
  other: 'Other',
};

const SERVICE_LABELS = {
  folding: 'Folding',
  bagging: 'Bagging',
  relabeling: 'Relabeling',
  hangtags: 'Hangtags',
  other: 'Other',
};

const SIZE_FIELDS = [
  ['size_xs', 'XS'],
  ['size_s', 'S'],
  ['size_m', 'M'],
  ['size_l', 'L'],
  ['size_xl', 'XL'],
  ['size_2xl', '2XL'],
  ['size_3xl', '3XL'],
  ['size_4xl', '4XL'],
];

function esc(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getArrayField(data, baseName) {
  const bracketKey = `${baseName}[]`;
  const raw = data[bracketKey] !== undefined ? data[bracketKey] : data[baseName];
  if (raw === undefined || raw === null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function humanizeList(values, labels) {
  return values.map((v) => labels[v] || v).filter(Boolean).join(', ');
}

function summarizeSizes(data) {
  return SIZE_FIELDS
    .map(([field, label]) => {
      const qty = data[field];
      return qty ? `${label}: ${qty}` : null;
    })
    .filter(Boolean)
    .join(', ');
}

function buildSections(data) {
  const sections = [
    {
      title: 'Contact & Project',
      items: [
        ['Company', data.company],
        ['Contact Name', data.contact_name],
        ['Email', data.email],
        ['Phone', data.phone],
        ['Project Name', data.project_name],
        ['Completion Date', data.completion_date],
        ['Event Date', data.event_date],
      ],
    },
    {
      title: 'Garments',
      items: [
        ['Garment Style', data.garment_style],
        ['Garment Color', data.garment_color],
        ['Total Quantity', data.total_quantity],
        ['Sizes', summarizeSizes(data)],
        ['Garment Notes', data.garment_notes],
      ],
    },
    {
      title: 'Print Details',
      items: [
        ['Print Location(s)', humanizeList(getArrayField(data, 'print_location'), PRINT_LOCATION_LABELS)],
        ['Other Print Location', data.other_print_location],
        ['Ink Color Count', data.ink_color_count],
        ['Ink Color(s)', data.ink_colors],
        ['Placement Notes', data.placement_notes],
        ['Artwork Status', ARTWORK_STATUS_LABELS[data.artwork_status] || data.artwork_status],
        ['Artwork Reference', data.artwork_reference],
        ['Artwork Upload', data.artwork_upload],
      ],
    },
    {
      title: 'Finishing & Delivery',
      items: [
        ['Additional Services', humanizeList(getArrayField(data, 'services'), SERVICE_LABELS)],
        ['Other Service', data.other_service],
        ['Delivery Method', DELIVERY_METHOD_LABELS[data.delivery_method] || data.delivery_method],
        ['Shipping Address', data.shipping_address],
      ],
    },
    {
      title: 'Order Notes',
      items: [['Notes', data.order_notes]],
    },
    {
      title: 'Submission Info',
      items: [
        ['Submitted By', data.submitted_by],
        ['Submitted Date', data.submitted_date],
      ],
    },
  ];

  return sections
    .map((section) => ({
      title: section.title,
      items: section.items.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ''),
    }))
    .filter((section) => section.items.length > 0);
}

function renderHtml(sections) {
  const sectionHtml = sections
    .map((section) => {
      const rows = section.items
        .map(([label, value]) => {
          const isArtworkLink = label === 'Artwork Upload' && /^https?:\/\//.test(String(value));
          const renderedValue = isArtworkLink
            ? `<a href="${esc(value)}" style="color:#B8341B;">View uploaded artwork</a>`
            : esc(value);
          return `<tr>
            <td style="padding:6px 0;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7A6F65;width:180px;vertical-align:top;">${esc(label)}</td>
            <td style="padding:6px 0;font-size:14px;color:#1A1714;">${renderedValue}</td>
          </tr>`;
        })
        .join('');

      return `<tr>
        <td colspan="2" style="padding:22px 0 8px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.08em;text-transform:uppercase;color:#B8341B;border-top:1px solid rgba(26,23,20,.12);">${esc(section.title)}</td>
      </tr>${rows}`;
    })
    .join('');

  return `<div style="background:#F0EBE0;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#F0EBE0;">
      <tr>
        <td style="background:#0E0D0B;padding:20px 24px;">
          <div style="font-family:'Bebas Neue',sans-serif;color:#F0EBE0;font-size:20px;letter-spacing:.08em;">COWDOG PRINT CO.</div>
          <div style="font-family:'Bebas Neue',sans-serif;color:#B8341B;font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-top:4px;">New Screen Printing Order</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 28px;">
          <table role="presentation" width="100%" style="border-collapse:collapse;">${sectionHtml}</table>
        </td>
      </tr>
    </table>
  </div>`;
}

function renderText(sections) {
  return sections
    .map((section) => {
      const lines = section.items.map(([label, value]) => `${label}: ${value}`).join('\n');
      return `${section.title.toUpperCase()}\n${lines}`;
    })
    .join('\n\n');
}

exports.handler = async (event) => {
  let payload;
  try {
    const body = JSON.parse(event.body || '{}');
    payload = body.payload;
  } catch (err) {
    console.error('submission-created: could not parse event body', err);
    return { statusCode: 400, body: 'Bad request' };
  }

  if (!payload || payload.form_name !== 'cowdog-order-form') {
    return { statusCode: 200, body: 'Skipped (not the order form)' };
  }

  const data = payload.data || {};

  if (data['bot-field']) {
    return { statusCode: 200, body: 'Skipped (honeypot triggered)' };
  }

  if (!RESEND_API_KEY) {
    console.error('submission-created: RESEND_API_KEY is not set — cannot send order notification email');
    return { statusCode: 500, body: 'Email service not configured' };
  }

  const sections = buildSections(data);
  const subjectBits = [data.project_name, data.company, data.contact_name].filter(Boolean);
  const subject = `New Order Form: ${subjectBits[0] || 'Untitled'}${subjectBits[1] ? ' — ' + subjectBits[1] : ''}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: data.email ? [data.email] : undefined,
        subject,
        html: renderHtml(sections),
        text: renderText(sections),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('submission-created: Resend API error', res.status, text);
      return { statusCode: 502, body: 'Failed to send email' };
    }

    return { statusCode: 200, body: 'Order notification email sent' };
  } catch (err) {
    console.error('submission-created: failed to send order notification email', err);
    return { statusCode: 500, body: 'Failed to send email' };
  }
};
