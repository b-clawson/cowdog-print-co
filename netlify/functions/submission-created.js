// Netlify invokes this automatically for every form submission on the site
// (the "submission-created" filename is a Netlify convention, not a config choice).
// We only build a custom email for the order form; everything else is ignored
// so the homepage quote form keeps using Netlify's default notification.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.ORDER_FORM_TO_EMAIL || 'orders@cowdogprint.co';
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

const EMBROIDERY_PLACEMENT_LABELS = {
  hat: 'Hat',
  left_chest: 'Left Chest',
  full_front: 'Full Front',
  full_back: 'Full Back',
  other: 'Other',
};

const DIGITIZING_LABELS = {
  new_design: 'New Design (needs digitizing)',
  on_file: 'Already Digitized / On File',
  not_sure: 'Not Sure',
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

// Item field names are item{n}_decoration_type, item{n}_garment_style, etc.
// n is discovered from the submitted data rather than assumed, since items
// can be added/removed freely in the form and numbering isn't reused.
function discoverItemNumbers(data) {
  const numbers = new Set();
  Object.keys(data).forEach((key) => {
    const match = key.match(/^item(\d+)_decoration_type$/);
    if (match) numbers.add(Number(match[1]));
  });
  return Array.from(numbers).sort((a, b) => a - b);
}

function itemHasData(prefix, data) {
  const keys = ['garment_style', 'garment_color', 'total_quantity', ...SIZE_FIELDS.map(([f]) => f)];
  return keys.some((key) => data[`${prefix}${key}`] && String(data[`${prefix}${key}`]).trim() !== '');
}

// ── Shared HTML helpers ──────────────────────────────────────────

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

function caption(text) {
  return `<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin-bottom:6px;">${esc(text)}</div>`;
}

// ── Product item rendering ───────────────────────────────────────

function sizeTableHtml(prefix, data) {
  const cell = (label, qty) => {
    const bg = qty ? WARM : '#FFFFFF';
    return `<td style="border:1px solid ${TEXT};padding:8px 4px;text-align:center;width:12.5%;background:${bg};">
      <div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};">${label}</div>
      <div style="font-size:15px;font-weight:bold;color:${TEXT};">${qty || '—'}</div>
    </td>`;
  };
  const row1 = SIZE_FIELDS.slice(0, 4).map(([field, label]) => cell(label, data[`${prefix}${field}`])).join('');
  const row2 = SIZE_FIELDS.slice(4, 8).map(([field, label]) => cell(label, data[`${prefix}${field}`])).join('');
  return `<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:8px;">
    <tr>${row1}</tr>
    <tr>${row2}</tr>
  </table>`;
}

function screenPrintDetailsHtml(prefix, data) {
  const selected = getArrayField(data, `${prefix}print_location`);
  const boxes = Object.entries(PRINT_LOCATION_LABELS)
    .map(([value, label]) => checkboxLineHtml(label, selected.includes(value)))
    .join('');
  const otherNote = selected.includes('other') && data[`${prefix}other_print_location`]
    ? `<div style="font-size:13px;color:${TEXT};margin-top:4px;"><em>Other:</em> ${esc(data[`${prefix}other_print_location`])}</div>`
    : '';
  const inkRow = infoGridHtml([
    ['Ink Colors', data[`${prefix}ink_color_count`]],
    ['Color(s)', data[`${prefix}ink_colors`]],
  ]);
  return `${caption('Print Location(s)')}${boxes}${otherNote}<div style="margin-top:8px;">${inkRow}</div>`;
}

function embroideryDetailsHtml(prefix, data) {
  const selected = getArrayField(data, `${prefix}emb_placement`);
  const boxes = Object.entries(EMBROIDERY_PLACEMENT_LABELS)
    .map(([value, label]) => checkboxLineHtml(label, selected.includes(value)))
    .join('');
  const otherNote = selected.includes('other') && data[`${prefix}other_emb_placement`]
    ? `<div style="font-size:13px;color:${TEXT};margin-top:4px;"><em>Other:</em> ${esc(data[`${prefix}other_emb_placement`])}</div>`
    : '';
  const detailRow = infoGridHtml([
    ['Stitch Count', data[`${prefix}stitch_count`]],
    ['Thread Color(s)', data[`${prefix}thread_colors`]],
  ]);
  const digitizingValue = data[`${prefix}digitizing`];
  const digitizing = digitizingValue
    ? `<div style="font-size:13px;color:${TEXT};margin-top:6px;"><strong>Digitizing:</strong> ${esc(DIGITIZING_LABELS[digitizingValue] || digitizingValue)}</div>`
    : '';
  return `${caption('Placement(s)')}${boxes}${otherNote}<div style="margin-top:8px;">${detailRow}</div>${digitizing}`;
}

function artworkSubsectionHtml(prefix, data) {
  const status = data[`${prefix}artwork_status`];
  const attached = ['provided', 'cowdog_has_artwork', 'reorder'].includes(status) || !!data[`${prefix}artwork_upload`];
  const uploadUrl = data[`${prefix}artwork_upload`];
  const uploadLine = uploadUrl && /^https?:\/\//.test(String(uploadUrl))
    ? `<div style="font-size:13px;margin-top:4px;"><a href="${esc(uploadUrl)}" style="color:${RUST};">View uploaded artwork &rarr;</a></div>`
    : '';
  return `${caption('Artwork')}
    ${checkboxLineHtml('Attached', attached)}${checkboxLineHtml('See Instructions', !attached)}
    ${status ? `<div style="font-size:13px;color:${TEXT};margin-top:6px;"><strong>${esc(ARTWORK_STATUS_LABELS[status] || status)}</strong></div>` : ''}
    ${data[`${prefix}artwork_reference`] ? `<div style="font-size:13px;color:${TEXT};margin-top:2px;">${esc(data[`${prefix}artwork_reference`])}</div>` : ''}
    ${uploadLine}`;
}

function productBoxHtml(n, data) {
  const prefix = `item${n}_`;
  const isEmbroidery = data[`${prefix}decoration_type`] === 'embroidery';
  const decorationDetails = isEmbroidery ? embroideryDetailsHtml(prefix, data) : screenPrintDetailsHtml(prefix, data);
  const garmentNotes = data[`${prefix}garment_notes`];
  const placementNotes = data[`${prefix}placement_notes`];

  return `<div style="border:1px solid ${TEXT};margin-bottom:16px;">
    <div style="background:${RUST};color:${CREAM};font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px;">
      Product ${n} — ${isEmbroidery ? 'Embroidery' : 'Screen Print'}
    </div>
    <div style="padding:12px;">
      ${infoGridHtml([
        ['Garment Type', data[`${prefix}garment_style`]],
        ['Garment Color', data[`${prefix}garment_color`]],
        ['Total Qty', data[`${prefix}total_quantity`]],
      ])}
      ${sizeTableHtml(prefix, data)}
      ${garmentNotes ? `<div style="font-size:13px;color:${TEXT};margin-top:8px;"><em>Garment notes:</em> ${esc(garmentNotes)}</div>` : ''}
      <div style="margin-top:14px;border-top:1px solid rgba(26,23,20,.12);padding-top:12px;">${decorationDetails}</div>
      ${placementNotes ? `<div style="font-size:13px;color:${TEXT};margin-top:10px;"><em>Placement/design notes:</em> ${esc(placementNotes)}</div>` : ''}
      <div style="margin-top:14px;border-top:1px solid rgba(26,23,20,.12);padding-top:12px;">${artworkSubsectionHtml(prefix, data)}</div>
    </div>
  </div>`;
}

// ── Order-level sections ─────────────────────────────────────────

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
      ${caption('Additional Services')}
      ${serviceBoxes}${otherServiceNote}
      <div style="margin-top:10px;">${caption('Delivery')}</div>
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

function renderHtml(payload, data, itemNumbers) {
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

  const productBoxes = itemNumbers
    .filter((n) => itemHasData(`item${n}_`, data))
    .map((n) => productBoxHtml(n, data))
    .join('');

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
        <td style="padding:16px 20px 0;">${productBoxes}</td>
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

function renderProductText(n, data) {
  const prefix = `item${n}_`;
  const isEmbroidery = data[`${prefix}decoration_type`] === 'embroidery';
  const mark = (checked) => (checked ? '[x]' : '[ ]');
  const line = (label, value) => (value ? `${label}: ${value}` : null);

  const sizes = SIZE_FIELDS.map(([field, label]) => `${label}: ${data[`${prefix}${field}`] || '—'}`).join('  ');

  let decorationLines;
  if (isEmbroidery) {
    const selected = getArrayField(data, `${prefix}emb_placement`);
    const placements = Object.entries(EMBROIDERY_PLACEMENT_LABELS)
      .map(([value, label]) => `${mark(selected.includes(value))} ${label}`)
      .join('  ');
    decorationLines = [
      'PLACEMENT(S)',
      placements,
      selected.includes('other') && data[`${prefix}other_emb_placement`] ? `Other: ${data[`${prefix}other_emb_placement`]}` : null,
      line('Stitch Count', data[`${prefix}stitch_count`]),
      line('Thread Color(s)', data[`${prefix}thread_colors`]),
      data[`${prefix}digitizing`] ? `Digitizing: ${DIGITIZING_LABELS[data[`${prefix}digitizing`]] || data[`${prefix}digitizing`]}` : null,
    ].filter(Boolean).join('\n');
  } else {
    const selected = getArrayField(data, `${prefix}print_location`);
    const locations = Object.entries(PRINT_LOCATION_LABELS)
      .map(([value, label]) => `${mark(selected.includes(value))} ${label}`)
      .join('  ');
    decorationLines = [
      'PRINT LOCATION(S)',
      locations,
      selected.includes('other') && data[`${prefix}other_print_location`] ? `Other: ${data[`${prefix}other_print_location`]}` : null,
      line('Ink Colors', data[`${prefix}ink_color_count`]),
      line('Color(s)', data[`${prefix}ink_colors`]),
    ].filter(Boolean).join('\n');
  }

  const status = data[`${prefix}artwork_status`];
  const artworkLines = [
    ARTWORK_STATUS_LABELS[status] || status || null,
    data[`${prefix}artwork_reference`] ? `Reference: ${data[`${prefix}artwork_reference`]}` : null,
    data[`${prefix}artwork_upload`] ? `Uploaded file: ${data[`${prefix}artwork_upload`]}` : null,
  ].filter(Boolean).join('\n');

  return [
    `PRODUCT ${n} — ${isEmbroidery ? 'EMBROIDERY' : 'SCREEN PRINT'}`,
    [
      line('Garment Type', data[`${prefix}garment_style`]),
      line('Garment Color', data[`${prefix}garment_color`]),
      line('Total Qty', data[`${prefix}total_quantity`]),
    ].filter(Boolean).join('\n'),
    sizes,
    data[`${prefix}garment_notes`] ? `Garment notes: ${data[`${prefix}garment_notes`]}` : null,
    decorationLines,
    data[`${prefix}placement_notes`] ? `Placement/design notes: ${data[`${prefix}placement_notes`]}` : null,
    'ARTWORK',
    artworkLines,
  ].filter(Boolean).join('\n');
}

function renderText(payload, data, itemNumbers) {
  const mark = (checked) => (checked ? '[x]' : '[ ]');
  const line = (label, value) => (value ? `${label}: ${value}` : null);

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

  const products = itemNumbers
    .filter((n) => itemHasData(`item${n}_`, data))
    .map((n) => renderProductText(n, data))
    .join('\n\n');

  const selectedServices = getArrayField(data, 'services');
  const services = Object.entries(SERVICE_LABELS)
    .map(([value, label]) => `${mark(selectedServices.includes(value))} ${label}`)
    .join('  ');

  const delivery = Object.entries(DELIVERY_METHOD_LABELS)
    .map(([value, label]) => `${mark(data.delivery_method === value)} ${label}`)
    .join('  ');

  return `PRINT JOB ORDER FORM — ORDER ${orderNumber(payload)}

${top}

${products}

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
  const itemNumbers = discoverItemNumbers(data);

  const subjectBits = [data.project_name, data.company, data.contact_name].filter(Boolean);
  const productCount = itemNumbers.filter((n) => itemHasData(`item${n}_`, data)).length;
  const subject = `Order ${orderNumber(payload)}: ${subjectBits[0] || 'Untitled'}${subjectBits[1] ? ' — ' + subjectBits[1] : ''}${productCount > 1 ? ` (${productCount} products)` : ''}`;

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
        html: renderHtml(payload, data, itemNumbers),
        text: renderText(payload, data, itemNumbers),
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
