// Netlify invokes this automatically for every form submission on the site
// (the "submission-created" filename is a Netlify convention, not a config choice).
// We only build a custom email for the order form; everything else is ignored
// so the homepage quote form keeps using Netlify's default notification.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.ORDER_FORM_TO_EMAIL || 'info@cowdogprint.co';
const FROM_EMAIL = process.env.ORDER_FORM_FROM_EMAIL || 'Cowdog Print Co. Orders <orders@cowdogprint.co>';

const INK = '#0E0D0B';
const RUST = '#B8341B';
const CREAM = '#F0EBE0';
const WARM = '#E8E0D0';
const TEXT = '#1A1714';
const MUTED = '#7A6F65';

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

function orderNumber(payload) {
  return payload.number ? `#${payload.number}` : 'NEW';
}

function submittedDate(payload, data) {
  if (data.submitted_date) return data.submitted_date;
  if (payload.created_at) {
    const parsed = new Date(payload.created_at);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return '';
}

// ── HTML ──────────────────────────────────────────────────────────

function infoGridHtml(pairs) {
  const filled = pairs.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
  const rows = [];
  for (let i = 0; i < filled.length; i += 2) {
    const [label1, value1] = filled[i];
    const second = filled[i + 1];
    rows.push(`<tr>
      <td style="width:25%;padding:6px 8px 6px 0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};vertical-align:top;">${esc(label1)}</td>
      <td style="width:25%;padding:6px 16px 6px 0;font-size:14px;color:${TEXT};vertical-align:top;">${esc(value1)}</td>
      ${second ? `<td style="width:25%;padding:6px 8px 6px 0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};vertical-align:top;">${esc(second[0])}</td>
      <td style="width:25%;padding:6px 0;font-size:14px;color:${TEXT};vertical-align:top;">${esc(second[1])}</td>` : '<td colspan="2"></td>'}
    </tr>`);
  }
  return `<table role="presentation" width="100%" style="border-collapse:collapse;">${rows.join('')}</table>`;
}

function sectionBarHtml(title) {
  return `<div style="background:${INK};color:${CREAM};font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:8px 12px;">${esc(title)}</div>`;
}

function checkboxLineHtml(label, checked) {
  return `<span style="display:inline-block;margin:0 20px 8px 0;font-size:13px;color:${TEXT};">${checked ? '&#9745;' : '&#9744;'} ${esc(label)}</span>`;
}

function printLocationsHtml(data) {
  const selected = getArrayField(data, 'print_location');
  const boxes = Object.entries(PRINT_LOCATION_LABELS)
    .map(([value, label]) => checkboxLineHtml(label, selected.includes(value)))
    .join('');
  const otherNote = selected.includes('other') && data.other_print_location
    ? `<div style="font-size:13px;color:${TEXT};margin-top:4px;"><em>Other:</em> ${esc(data.other_print_location)}</div>`
    : '';
  return `<div style="border:1px solid ${TEXT};padding:12px;margin-bottom:16px;">
    ${sectionBarHtml('Print Locations')}
    <div style="padding:12px 4px 0;">${boxes}${otherNote}</div>
  </div>`;
}

function artworkBoxHtml(data) {
  const attached = ['provided', 'cowdog_has_artwork', 'reorder'].includes(data.artwork_status) || !!data.artwork_upload;
  const uploadUrl = data.artwork_upload;
  const uploadLine = uploadUrl && /^https?:\/\//.test(String(uploadUrl))
    ? `<div style="font-size:13px;margin-top:4px;"><a href="${esc(uploadUrl)}" style="color:${RUST};">View uploaded artwork &rarr;</a></div>`
    : '';
  return `<div style="border:1px solid ${TEXT};padding:12px;margin-bottom:16px;">
    ${sectionBarHtml('Artwork')}
    <div style="padding:12px 4px 0;">
      ${checkboxLineHtml('Attached', attached)}${checkboxLineHtml('See Instructions', !attached)}
      <div style="font-size:13px;color:${TEXT};margin-top:6px;"><strong>${esc(ARTWORK_STATUS_LABELS[data.artwork_status] || data.artwork_status || '—')}</strong></div>
      ${data.artwork_reference ? `<div style="font-size:13px;color:${TEXT};margin-top:2px;">${esc(data.artwork_reference)}</div>` : ''}
      ${uploadLine}
    </div>
  </div>`;
}

function printDetailsBoxHtml(data) {
  return `<div style="border:1px solid ${TEXT};padding:12px;margin-bottom:16px;">
    ${sectionBarHtml('Ink & Placement')}
    <div style="padding:12px 4px 0;">
      ${infoGridHtml([
        ['Ink Colors', data.ink_color_count],
        ['Color(s)', data.ink_colors],
      ])}
      ${data.placement_notes ? `<div style="font-size:13px;color:${TEXT};margin-top:8px;"><em>Placement notes:</em> ${esc(data.placement_notes)}</div>` : ''}
    </div>
  </div>`;
}

function sizeTableHtml(data) {
  const cell = (label, qty) => {
    const bg = qty ? WARM : '#FFFFFF';
    return `<td style="border:1px solid ${TEXT};padding:8px 4px;text-align:center;width:12.5%;background:${bg};">
      <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};">${label}</div>
      <div style="font-size:15px;font-weight:bold;color:${TEXT};">${qty || '—'}</div>
    </td>`;
  };
  const row1 = SIZE_FIELDS.slice(0, 4).map(([field, label]) => cell(label, data[field])).join('');
  const row2 = SIZE_FIELDS.slice(4, 8).map(([field, label]) => cell(label, data[field])).join('');
  return `<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:8px;">
    <tr>${row1}</tr>
    <tr>${row2}</tr>
  </table>`;
}

function garmentBoxHtml(data) {
  return `<div style="border:1px solid ${TEXT};padding:12px;margin-bottom:16px;">
    ${sectionBarHtml('Garment Type & Sizes')}
    <div style="padding:12px 4px 0;">
      ${infoGridHtml([
        ['Garment Type', data.garment_style],
        ['Garment Color', data.garment_color],
        ['Total Qty', data.total_quantity],
      ])}
      ${sizeTableHtml(data)}
      ${data.garment_notes ? `<div style="font-size:13px;color:${TEXT};margin-top:8px;"><em>Notes:</em> ${esc(data.garment_notes)}</div>` : ''}
    </div>
  </div>`;
}

function finishingBoxHtml(data) {
  const services = getArrayField(data, 'services');
  const serviceBoxes = Object.entries(SERVICE_LABELS)
    .map(([value, label]) => checkboxLineHtml(label, services.includes(value)))
    .join('');
  const otherServiceNote = services.includes('other') && data.other_service
    ? `<div style="font-size:13px;color:${TEXT};margin-top:2px;"><em>Other:</em> ${esc(data.other_service)}</div>`
    : '';

  const deliveryBoxes = Object.entries(DELIVERY_METHOD_LABELS)
    .map(([value, label]) => checkboxLineHtml(label, data.delivery_method === value))
    .join('');
  const shippingNote = data.delivery_method === 'shipping' && data.shipping_address
    ? `<div style="font-size:13px;color:${TEXT};margin-top:4px;"><em>Ship to:</em> ${esc(data.shipping_address)}</div>`
    : '';

  return `<div style="border:1px solid ${TEXT};padding:12px;margin-bottom:16px;">
    ${sectionBarHtml('Finishing & Delivery')}
    <div style="padding:12px 4px 0;">
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin-bottom:6px;">Additional Services</div>
      ${serviceBoxes}${otherServiceNote}
      <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin:10px 0 6px;">Delivery</div>
      ${deliveryBoxes}${shippingNote}
    </div>
  </div>`;
}

function specialInstructionsHtml(data) {
  const notes = data.order_notes && data.order_notes.trim() ? esc(data.order_notes) : '—';
  return `<div style="border:1px solid ${TEXT};margin-bottom:8px;">
    ${sectionBarHtml('Special Instructions')}
    <div style="padding:14px 12px;font-size:14px;color:${TEXT};white-space:pre-wrap;">${notes}</div>
  </div>`;
}

function renderHtml(payload, data) {
  const topGrid = infoGridHtml([
    ['Client', data.company],
    ['Project', data.project_name],
    ['Contact', data.contact_name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Due Date', data.completion_date],
    ['Event Date', data.event_date],
    ['Prepared By', data.submitted_by],
  ]);

  return `<div style="background:${CREAM};padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:${CREAM};border:1px solid ${TEXT};">
      <tr>
        <td style="background:${INK};padding:18px 20px;">
          <table role="presentation" width="100%">
            <tr>
              <td style="font-family:'Bebas Neue',sans-serif;color:${CREAM};font-size:22px;letter-spacing:.06em;">PRINT JOB ORDER FORM</td>
              <td style="text-align:right;">
                <span style="background:${CREAM};color:${INK};font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.06em;padding:6px 12px;display:inline-block;">ORDER ${esc(orderNumber(payload))}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 20px 4px;">${topGrid}</td>
      </tr>
      <tr>
        <td style="padding:16px 20px 0;">${printLocationsHtml(data)}</td>
      </tr>
      <tr>
        <td style="padding:0 20px;">
          <table role="presentation" width="100%">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:8px;">${printDetailsBoxHtml(data)}</td>
              <td style="width:50%;vertical-align:top;padding-left:8px;">${artworkBoxHtml(data)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px;">${garmentBoxHtml(data)}</td>
      </tr>
      <tr>
        <td style="padding:0 20px;">${finishingBoxHtml(data)}</td>
      </tr>
      <tr>
        <td style="padding:0 20px 20px;">${specialInstructionsHtml(data)}</td>
      </tr>
    </table>
  </div>`;
}

// ── Plain text ────────────────────────────────────────────────────

function renderText(payload, data) {
  const line = (label, value) => (value ? `${label}: ${value}` : null);
  const mark = (checked) => (checked ? '[x]' : '[ ]');

  const top = [
    line('Client', data.company),
    line('Project', data.project_name),
    line('Contact', data.contact_name),
    line('Email', data.email),
    line('Phone', data.phone),
    line('Due Date', data.completion_date),
    line('Event Date', data.event_date),
    line('Prepared By', data.submitted_by),
  ].filter(Boolean).join('\n');

  const selectedLocations = getArrayField(data, 'print_location');
  const locations = Object.entries(PRINT_LOCATION_LABELS)
    .map(([value, label]) => `${mark(selectedLocations.includes(value))} ${label}`)
    .join('  ');

  const sizes = SIZE_FIELDS.map(([field, label]) => `${label}: ${data[field] || '—'}`).join('  ');

  const selectedServices = getArrayField(data, 'services');
  const services = Object.entries(SERVICE_LABELS)
    .map(([value, label]) => `${mark(selectedServices.includes(value))} ${label}`)
    .join('  ');

  const delivery = Object.entries(DELIVERY_METHOD_LABELS)
    .map(([value, label]) => `${mark(data.delivery_method === value)} ${label}`)
    .join('  ');

  return `PRINT JOB ORDER FORM — ORDER ${orderNumber(payload)}

${top}

PRINT LOCATIONS
${locations}
${selectedLocations.includes('other') && data.other_print_location ? `Other: ${data.other_print_location}` : ''}

INK & PLACEMENT
${line('Ink Colors', data.ink_color_count) || ''}
${line('Color(s)', data.ink_colors) || ''}
${data.placement_notes ? `Placement notes: ${data.placement_notes}` : ''}

ARTWORK
${ARTWORK_STATUS_LABELS[data.artwork_status] || data.artwork_status || '—'}
${data.artwork_reference ? `Reference: ${data.artwork_reference}` : ''}
${data.artwork_upload ? `Uploaded file: ${data.artwork_upload}` : ''}

GARMENT TYPE & SIZES
${line('Garment Type', data.garment_style) || ''}
${line('Garment Color', data.garment_color) || ''}
${line('Total Qty', data.total_quantity) || ''}
${sizes}
${data.garment_notes ? `Notes: ${data.garment_notes}` : ''}

FINISHING & DELIVERY
Services: ${services}
Delivery: ${delivery}
${data.delivery_method === 'shipping' && data.shipping_address ? `Ship to: ${data.shipping_address}` : ''}

SPECIAL INSTRUCTIONS
${data.order_notes && data.order_notes.trim() ? data.order_notes : '—'}
`.replace(/\n{3,}/g, '\n\n');
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

  data.submitted_date = submittedDate(payload, data);

  const subjectBits = [data.project_name, data.company, data.contact_name].filter(Boolean);
  const subject = `Order ${orderNumber(payload)}: ${subjectBits[0] || 'Untitled'}${subjectBits[1] ? ' — ' + subjectBits[1] : ''}`;

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
        html: renderHtml(payload, data),
        text: renderText(payload, data),
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
