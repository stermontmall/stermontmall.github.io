/*
 * Stermont Arcade transactional email renderer.
 * Public integration stays stable:
 *   STMOrderEmails.send(payload, data) -> Promise<boolean>
 *   STMOrderEmails.status(order, state) -> Promise<boolean>
 * EmailJS service_zoho / template_n60yao4. Never let email failures affect checkout/admin.
 */
(function (root) {
  'use strict';
  var CFG = {
    key: 'PayiXKhM6gVQLHYAE',
    service: 'service_zoho',
    tpl: 'template_n60yao4',
    staff: 'support@stermontarcade.co.ke',
    site: 'https://stermontarcade.co.ke',
    logo: 'https://stermontarcade.co.ke/logo-horizontal.png',
    wa: '254789514060',
    admin: 'https://stermontarcade.co.ke/neon-admin-orders.html'
  };
  var FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;";
  var STATUS = {
    placed: { title: 'Order received', short: 'Order placed', preheader: 'We have received your Stermont Arcade order.', icon: '＋', accent: '#6d28d9', tint: '#f3eaff', text: 'Thank you. Your order is with us and is awaiting payment verification. We will contact you if we need any clarification.' },
    confirmed: { title: 'Your order is confirmed', short: 'Confirmed', preheader: 'Your payment has been verified and your order is confirmed.', icon: '✓', accent: '#2563a6', tint: '#eaf3ff', text: 'Your payment has been verified. We are preparing your order and will keep you updated as it moves forward.' },
    packed: { title: 'Your order is packed', short: 'Packed', preheader: 'Your Stermont Arcade order has been packed and is moving to the next step.', icon: '▣', accent: '#a16207', tint: '#fff7df', text: 'Your items are packed. We will contact you on WhatsApp with the next collection or delivery update.' },
    delivered: { title: 'Your order is complete', short: 'Delivered', preheader: 'Your Stermont Arcade order has been delivered or collected.', icon: '◆', accent: '#16734a', tint: '#e8f7ef', text: 'Your order has been delivered or collected. Thank you for choosing Stermont Arcade. If anything needs attention, please contact our team.' },
    declined: { title: 'Let’s sort out your order', short: 'Needs attention', preheader: 'There is a payment verification issue with your Stermont Arcade order.', icon: '!', accent: '#b42335', tint: '#fff0f1', text: 'We could not verify the M-Pesa payment against this order yet. Please do not pay again just yet. Send us the M-Pesa confirmation message and your order reference on WhatsApp, and our team will help you resolve it.' }
  };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function numeric(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function money(value) {
    return 'KSh ' + Math.round(numeric(value)).toLocaleString('en-KE');
  }
  function digits(value) { return String(value == null ? '' : value).replace(/\D/g, ''); }
  function safeImage(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw || raw.length > 2048) return '';
    try {
      var parsed = new URL(raw);
      return parsed.protocol === 'https:' ? parsed.href : '';
    } catch (e) { return ''; }
  }
  function itemsOf(order) {
    return Array.isArray(order && order.items) ? order.items : [];
  }
  function itemImage(item) {
    return safeImage(item && (item.image_url || item.image || item.photo_url || item.photo || item.product_image));
  }
  function lineTotal(item) {
    if (item && item.total != null) return numeric(item.total);
    if (item && item.price != null && item.qty != null) return numeric(item.price) * numeric(item.qty);
    return 0;
  }
  function orderTotal(order) {
    var subtotal = numeric(order && order.subtotal);
    var discount = numeric(order && order.discount);
    return Math.max(0, subtotal - discount);
  }
  function orderRef(order) { return String(order && order.ref || ''); }
  function trackUrl(ref) { return CFG.site + '/track.html?ref=' + encodeURIComponent(ref); }
  function waUrl(ref, staffPhone) {
    var message = 'Hello Stermont Arcade, I am following up on order ' + ref + '.';
    if (staffPhone) message = 'Hello, I am following up on order ' + ref + '.';
    return 'https://wa.me/' + (staffPhone ? digits(staffPhone) : CFG.wa) + '?text=' + encodeURIComponent(message);
  }
  function iconMarkup(state) {
    var s = STATUS[state] || STATUS.placed;
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" valign="middle" width="54" height="54" bgcolor="' + s.accent + '" style="width:54px;height:54px;border-radius:27px;background:' + s.accent + ';color:#ffffff;' + FONT + 'font-size:26px;line-height:54px;font-weight:800;">' + esc(s.icon) + '</td></tr></table>';
  }
  function progress(state) {
    var active = state === 'declined' ? 0 : ({ placed: 0, confirmed: 1, packed: 2, delivered: 3 }[state] == null ? 0 : { placed: 0, confirmed: 1, packed: 2, delivered: 3 }[state]);
    var labels = ['Order placed', 'Confirmed', 'Packed', 'Delivered'];
    var cells = labels.map(function (label, index) {
      var done = index < active;
      var current = index === active;
      var color = done ? '#16734a' : (current ? (STATUS[state] || STATUS.placed).accent : '#b7adc9');
      var bg = done ? '#e8f7ef' : (current ? (STATUS[state] || STATUS.placed).tint : '#f4f1f8');
      var mark = done ? '✓' : String(index + 1);
      return '<td width="25%" align="center" valign="top" style="padding:0 2px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" valign="middle" width="26" height="26" bgcolor="' + bg + '" style="width:26px;height:26px;border-radius:13px;background:' + bg + ';color:' + color + ';' + FONT + 'font-size:13px;line-height:26px;font-weight:800;">' + mark + '</td></tr></table>' +
        '<div style="' + FONT + 'font-size:10px;line-height:1.35;padding-top:7px;color:' + (current || done ? '#34234e' : '#827891') + ';font-weight:' + (current ? '800' : '600') + ';">' + esc(label) + '</div></td>';
    }).join('');
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + cells + '</tr></table>';
  }
  function itemRows(items) {
    if (!items.length) return '<tr><td colspan="3" style="' + FONT + 'font-size:13px;color:#746987;padding:14px 0;">Order items are listed in your order record.</td></tr>';
    return items.map(function (item) {
      var name = esc(item && item.name || 'Item');
      var qty = Math.max(0, numeric(item && item.qty));
      var total = money(lineTotal(item));
      var img = itemImage(item);
      var visual = img
        ? '<img src="' + esc(img) + '" width="52" height="52" alt="' + name + '" style="display:block;width:52px;height:52px;object-fit:cover;border:0;border-radius:9px;background:#f4f1f8;">'
        : '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="52" height="52" align="center" valign="middle" bgcolor="#f1eafd" style="width:52px;height:52px;border-radius:9px;background:#f1eafd;color:#6d28d9;' + FONT + 'font-size:17px;font-weight:800;">SA</td></tr></table>';
      return '<tr><td width="62" valign="middle" style="padding:10px 8px 10px 0;border-bottom:1px solid #eee9f5;">' + visual + '</td>' +
        '<td valign="middle" style="padding:10px 8px;border-bottom:1px solid #eee9f5;' + FONT + 'font-size:13px;line-height:1.45;color:#241a35;">' + name + '<div style="padding-top:3px;color:#786d88;font-size:12px;">Qty ' + esc(qty) + '</div></td>' +
        '<td width="94" align="right" valign="middle" style="padding:10px 0 10px 6px;border-bottom:1px solid #eee9f5;' + FONT + 'font-size:13px;font-weight:800;color:#241a35;white-space:nowrap;">' + esc(total) + '</td></tr>';
    }).join('');
  }
  function row(label, value, strong) {
    return '<tr><td style="padding:5px 0;' + FONT + 'font-size:13px;color:' + (strong ? '#241a35' : '#746987') + ';font-weight:' + (strong ? '800' : '500') + ';">' + esc(label) + '</td><td align="right" style="padding:5px 0;' + FONT + 'font-size:' + (strong ? '17px' : '13px') + ';color:' + (strong ? '#5b21b6' : '#241a35') + ';font-weight:' + (strong ? '900' : '700') + ';white-space:nowrap;">' + esc(value) + '</td></tr>';
  }
  function deliveryAddress(order) {
    var address = String(order && order.address || '').trim();
    var county = String(order && order.county || '').trim();
    if (address && county && address.toLowerCase().indexOf(county.toLowerCase()) !== -1) return address;
    return [address, county].filter(Boolean).join(', ');
  }
  function deliveryDetails(order, state) {
    var pickup = order && order.method === 'pickup';
    var heading = pickup ? 'Pickup at Stermont Arcade' : 'Delivery destination';
    var address = pickup ? 'Sarit Centre, Westlands, Nairobi. Walk-ins welcome daily, 8:00 AM–8:00 PM.' :
      deliveryAddress(order);
    var timing = {
      placed: 'We will contact you after the M-Pesa payment is verified.',
      confirmed: 'Your order is being prepared. We will share the next update on WhatsApp.',
      packed: pickup ? 'Your order is packed. Please wait for our collection-ready confirmation before travelling.' : 'Your order is packed. Our team will contact you with the dispatch update.',
      delivered: pickup ? 'Collection has been marked complete.' : 'Delivery has been marked complete.',
      declined: 'Please contact us with your M-Pesa confirmation message before making another payment.'
    }[state] || 'We will contact you with your next update.';
    return '<tr><td style="padding:0 22px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f8f6fb" style="background:#f8f6fb;border:1px solid #eee9f5;border-radius:13px;padding:14px 15px;">' +
      '<div style="' + FONT + 'font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#746987;font-weight:800;">' + esc(heading) + '</div>' +
      '<div style="' + FONT + 'font-size:14px;line-height:1.5;color:#241a35;font-weight:700;padding-top:5px;">' + esc(address || (pickup ? 'Sarit Centre, Westlands, Nairobi' : 'Delivery address to be confirmed')) + '</div>' +
      '<div style="' + FONT + 'font-size:12px;line-height:1.5;color:#625772;padding-top:7px;">' + esc(timing) + '</div>' +
      '</td></tr></table></td></tr>';
  }
  function paymentBox(order) {
    var verified = !!(order && order.pay_verified);
    var badgeColor = verified ? '#16734a' : '#9a6200';
    var badgeBg = verified ? '#e8f7ef' : '#fff4d8';
    return '<tr><td style="padding:0 22px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f8f6fb" style="background:#f8f6fb;border:1px solid #eee9f5;border-radius:13px;padding:14px 15px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + FONT + 'font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#746987;font-weight:800;">M-Pesa payment</td>' +
      '<td align="right"><span style="display:inline-block;background:' + badgeBg + ';color:' + badgeColor + ';padding:5px 8px;border-radius:20px;' + FONT + 'font-size:10px;font-weight:800;">' + (verified ? 'VERIFIED' : 'AWAITING VERIFICATION') + '</span></td></tr></table>' +
      '<div style="' + FONT + 'font-size:18px;line-height:1.4;color:#241a35;font-weight:900;padding-top:9px;">' + esc(money(order && order.pay_amount)) + '</div>' +
      '<div style="' + FONT + 'font-size:12px;color:#625772;padding-top:3px;">M-Pesa code: <b style="color:#241a35;">' + esc(order && order.pay_code || 'Not provided') + '</b></div>' +
      '</td></tr></table></td></tr>';
  }
  function summary(order) {
    var subtotal = numeric(order && order.subtotal);
    var discount = numeric(order && order.discount);
    var voucher = String(order && order.voucher_code || '');
    var total = orderTotal(order);
    var extras = row('Subtotal', money(subtotal), false);
    if (discount > 0) extras += row(voucher ? 'Discount (' + voucher + ')' : 'Discount', '− ' + money(discount), false);
    extras += row('Total', money(total), true);
    return '<tr><td style="padding:0 22px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eee9f5;border-radius:13px;">' +
      '<tr><td colspan="3" style="padding:14px 14px 4px;' + FONT + 'font-size:14px;color:#241a35;font-weight:900;">Order summary</td></tr>' +
      '<tr><td colspan="3" style="padding:0 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + itemRows(itemsOf(order)) + '</table></td></tr>' +
      '<tr><td colspan="3" style="padding:10px 14px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + extras + '</table></td></tr></table></td></tr>';
  }
  function button(url, label, bg, fg) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 9px;"><tr><td align="center" bgcolor="' + bg + '" style="background:' + bg + ';border-radius:11px;">' +
      '<a href="' + esc(url) + '" style="display:inline-block;padding:14px 22px;' + FONT + 'font-size:14px;line-height:18px;font-weight:800;color:' + fg + ';text-decoration:none;border-radius:11px;">' + esc(label) + '</a>' +
      '</td></tr></table>';
  }
  function preheader(text) {
    return '<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">' + esc(text) + '&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>';
  }
  function htmlEmail(order, state, kind) {
    var s = STATUS[state] || STATUS.placed;
    var ref = orderRef(order);
    var staff = kind === 'staff';
    var customerName = order && order.customer_name || '';
    var greeting = staff ? 'New order needs attention' : ('Hello ' + esc(customerName || 'there') + ',');
    var title = staff ? 'New order received' : s.title;
    var intro = staff
      ? 'A customer has placed an order. Review the details below and verify the M-Pesa payment before approving it.'
      : s.text;
    var accent = staff ? '#5b21b6' : s.accent;
    var tint = staff ? '#f3eaff' : s.tint;
    var adminUrl = CFG.admin + '?ref=' + encodeURIComponent(ref);
    var staffContact = digits(order && order.phone);
    var contactRow = staff
      ? '<tr><td style="padding:0 22px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f8f6fb" style="background:#f8f6fb;border:1px solid #eee9f5;border-radius:13px;padding:14px 15px;">' +
        '<div style="' + FONT + 'font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#746987;font-weight:800;">Customer contact</div>' +
        '<div style="' + FONT + 'font-size:16px;font-weight:900;padding-top:7px;"><a href="tel:+' + esc(staffContact) + '" style="color:#241a35;text-decoration:underline;">' + esc(order && order.phone || 'Phone not supplied') + '</a></div>' +
        (order && order.email ? '<div style="' + FONT + 'font-size:12px;color:#625772;padding-top:4px;">' + esc(order.email) + '</div>' : '') +
        (order && order.notes ? '<div style="' + FONT + 'font-size:12px;line-height:1.5;color:#625772;padding-top:8px;"><b>Customer notes:</b> ' + esc(order.notes) + '</div>' : '') +
        '</td></tr></table></td></tr>' : '';
    var buttons = staff
      ? button(adminUrl, 'Open admin orders', '#5b21b6', '#ffffff') + button(waUrl(ref, order && order.phone), 'WhatsApp customer', '#16834a', '#ffffff')
      : button(trackUrl(ref), 'Track your order', '#5b21b6', '#ffffff') + button(waUrl(ref, false), 'Chat on WhatsApp', '#16834a', '#ffffff');
    var headingIcon = staff ? iconMarkup('placed') : iconMarkup(state);
    var hero = '<tr><td align="center" bgcolor="' + accent + '" style="background:' + accent + ';padding:26px 22px 22px;">' +
      '<img src="' + CFG.logo + '" width="205" height="46" alt="Stermont Arcade" style="display:block;width:205px;height:46px;max-width:100%;object-fit:contain;border:0;margin:0 auto 15px;">' +
      headingIcon +
      '<div style="' + FONT + 'font-size:23px;line-height:1.2;font-weight:900;color:#ffffff;padding-top:13px;">' + esc(title) + '</div>' +
      '<div style="' + FONT + 'font-size:13px;line-height:1.5;color:#f0e9ff;padding-top:7px;">Order <b style="color:#ffffff;">' + esc(ref) + '</b></div>' +
      '</td></tr>';
    var body = '<tr><td style="padding:22px 22px 10px;">' +
      '<div style="' + FONT + 'font-size:15px;line-height:1.5;font-weight:800;color:#241a35;">' + greeting + '</div>' +
      '<div style="' + FONT + 'font-size:13px;line-height:1.65;color:#625772;padding-top:8px;">' + esc(intro) + '</div>' +
      '</td></tr>' +
      '<tr><td style="padding:8px 22px 19px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + tint + '" style="background:' + tint + ';border-radius:13px;"><tr><td style="padding:14px 13px;">' +
      '<div style="' + FONT + 'font-size:11px;font-weight:900;color:' + accent + ';letter-spacing:1px;text-transform:uppercase;padding-bottom:11px;">Order progress</div>' + progress(state) +
      '</td></tr></table></td></tr>' +
      summary(order) + paymentBox(order) + deliveryDetails(order, state) + contactRow +
      '<tr><td align="center" style="padding:0 22px 16px;">' + buttons + '</td></tr>' +
      '<tr><td style="padding:0 22px 22px;text-align:center;' + FONT + 'font-size:11px;line-height:1.6;color:#746987;">Delivery available across all 47 counties in Kenya. For help, reply to this email or chat with us on WhatsApp.</td></tr>';
    var footer = '<tr><td align="center" bgcolor="#24113f" style="background:#24113f;padding:18px 18px 20px;">' +
      '<div style="' + FONT + 'font-size:13px;font-weight:900;color:#ffffff;">Stermont Arcade</div>' +
      '<div style="' + FONT + 'font-size:11px;line-height:1.8;color:#e0d7ed;padding-top:7px;">+254 789 514 060 &nbsp;|&nbsp; <a href="mailto:support@stermontarcade.co.ke" style="color:#ffffff;text-decoration:underline;">support@stermontarcade.co.ke</a><br>' +
      '<a href="' + CFG.site + '/returns.html" style="color:#e0d7ed;text-decoration:underline;">Returns</a> &nbsp;·&nbsp; <a href="' + CFG.site + '/shipping.html" style="color:#e0d7ed;text-decoration:underline;">Shipping</a> &nbsp;·&nbsp; <a href="' + CFG.site + '" style="color:#e0d7ed;text-decoration:underline;">Visit our store</a></div>' +
      '<div style="' + FONT + 'font-size:10px;line-height:1.5;color:#bfb1d2;padding-top:10px;">Thank you for shopping with confidence. We are here to help at every step.</div>' +
      '</td></tr>';
    var doc = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>' + esc(title) + '</title></head><body bgcolor="#f2eef8" style="margin:0;padding:0;background-color:#f2eef8;">' +
      preheader(staff ? 'New order ' + ref + ' from ' + customerName + '. Verify payment and arrange delivery or pickup.' : s.preheader + ' Order ' + ref + '.') +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f2eef8" style="width:100%;background:#f2eef8;"><tr><td align="center" style="padding:18px 8px;">' +
      '<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e8e1f0;border-radius:18px;overflow:hidden;">' +
      hero + body + footer +
      '</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>';
    return doc;
  }
  function textEmail(order, state, kind) {
    var s = STATUS[state] || STATUS.placed;
    var ref = orderRef(order);
    var lines = [];
    lines.push(kind === 'staff' ? 'NEW STERMONT ARCADE ORDER' : s.title.toUpperCase());
    lines.push('Order: ' + ref);
    lines.push('');
    if (kind === 'staff') lines.push('Review the order and verify the M-Pesa payment before approving.');
    else lines.push(s.text);
    lines.push('');
    lines.push('ORDER ITEMS');
    itemsOf(order).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + String(item && item.name || 'Item') + ' x' + numeric(item && item.qty) + ' — ' + money(lineTotal(item)));
    });
    lines.push('');
    lines.push('Subtotal: ' + money(order && order.subtotal));
    if (numeric(order && order.discount) > 0) lines.push('Discount: -' + money(order.discount) + (order.voucher_code ? ' (' + order.voucher_code + ')' : ''));
    lines.push('Total: ' + money(orderTotal(order)));
    lines.push('M-Pesa code: ' + String(order && order.pay_code || 'Not provided'));
    lines.push('Payment amount: ' + money(order && order.pay_amount));
    lines.push('Payment status: ' + (order && order.pay_verified ? 'Verified' : 'Awaiting verification'));
    lines.push('');
    lines.push(order && order.method === 'pickup' ? 'Pickup: Stermont Arcade, Sarit Centre, Westlands, Nairobi.' : 'Delivery: ' + deliveryAddress(order));
    if (kind === 'staff') {
      lines.push('Customer: ' + String(order && order.customer_name || ''));
      lines.push('Phone: ' + String(order && order.phone || ''));
      if (order && order.notes) lines.push('Notes: ' + String(order.notes));
      lines.push('Admin: ' + CFG.admin + '?ref=' + encodeURIComponent(ref));
      lines.push('WhatsApp customer: ' + waUrl(ref, order && order.phone));
    } else {
      lines.push('Track your order: ' + trackUrl(ref));
      lines.push('WhatsApp: ' + waUrl(ref, false));
    }
    lines.push('');
    lines.push('Stermont Arcade | +254 789 514 060 | support@stermontarcade.co.ke');
    lines.push('Returns: ' + CFG.site + '/returns.html');
    lines.push('Shipping: ' + CFG.site + '/shipping.html');
    return lines.join('\n');
  }
  function payloadFor(order, state, kind) {
    var staff = kind === 'staff';
    var ref = orderRef(order);
    var email = staff ? CFG.staff : String(order && order.email || '');
    return {
      to_email: email,
      reply_to: staff ? String(order && order.email || CFG.staff) : CFG.staff,
      subject: staff ? 'New Stermont order ' + ref + ' — ' + money(orderTotal(order)) : (STATUS[state] || STATUS.placed).title + ' — order ' + ref,
      business: 'Stermont Arcade',
      order_ref: ref,
      name: staff ? 'Stermont team' : String(order && order.customer_name || ''),
      customer_name: String(order && order.customer_name || ''),
      customer_phone: String(order && order.phone || ''),
      headline: staff ? 'New order received' : (STATUS[state] || STATUS.placed).title,
      total: money(orderTotal(order)),
      order_total: money(orderTotal(order)),
      items: textEmail(order, state, kind),
      order_items: textEmail(order, state, kind),
      delivery: order && order.method === 'pickup' ? 'Pickup at Stermont Arcade, Sarit Centre, Westlands' : deliveryAddress(order),
      mpesa_code: String(order && order.pay_code || ''),
      phone: '+254 789 514 060',
      web: 'stermontarcade.co.ke',
      message: textEmail(order, state, kind),
      html_body: htmlEmail(order, state, kind),
      text_body: textEmail(order, state, kind)
    };
  }
  function sendOne(params) {
    if (typeof root.fetch !== 'function') return Promise.resolve(false);
    var controller = typeof root.AbortController === 'function' ? new root.AbortController() : null;
    var timerId = null;
    var options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: CFG.service, template_id: CFG.tpl, user_id: CFG.key, template_params: params })
    };
    if (controller) options.signal = controller.signal;
    var request;
    try { request = root.fetch('https://api.emailjs.com/api/v1.0/email/send', options); }
    catch (error) {
      if (root.console && root.console.warn) root.console.warn('EmailJS error', error && error.message);
      return Promise.resolve(false);
    }
    var timeout = new Promise(function (_, reject) {
      timerId = root.setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('EmailJS request timed out after 12000ms'));
      }, 12000);
    });
    return Promise.race([request, timeout]).then(function (response) {
      if (response && response.ok) return true;
      if (response && typeof response.text === 'function') return response.text().catch(function () { return ''; }).then(function (body) {
        if (root.console && root.console.warn) root.console.warn('EmailJS failed', response.status, body);
        return false;
      });
      return false;
    }).catch(function (error) {
      if (root.console && root.console.warn) root.console.warn('EmailJS error', error && error.message);
      return false;
    }).then(function (result) {
      if (timerId !== null) root.clearTimeout(timerId);
      return result;
    });
  }
  function render(order, state, kind) {
    var safeState = STATUS[state] ? state : 'placed';
    return { html: htmlEmail(order || {}, safeState, kind || 'customer'), text: textEmail(order || {}, safeState, kind || 'customer'), params: payloadFor(order || {}, safeState, kind || 'customer') };
  }
  function send(payload, data) {
    try {
      var p = payload || {};
      var d = data || {};
      var order = {
        ref: d.ref || p.p_ref || '',
        created_at: d.created_at || '',
        customer_name: d.customer_name || p.p_customer_name || '',
        phone: d.phone || p.p_phone || '',
        email: d.email || p.p_email || '',
        method: d.method || p.p_method || 'delivery',
        county: d.county || p.p_county || '',
        address: d.address || p.p_address || '',
        notes: d.notes || p.p_notes || '',
        items: Array.isArray(d.items) ? d.items : [],
        subtotal: d.subtotal,
        discount: d.discount,
        voucher_code: d.voucher_code || p.p_voucher_code || '',
        pay_code: d.pay_code || p.p_pay_code || '',
        pay_amount: d.pay_amount != null ? d.pay_amount : p.p_pay_amount,
        pay_verified: !!d.pay_verified,
        status: d.status || 'pending',
        stage: d.stage || ''
      };
      var jobs = [sendOne(payloadFor(order, 'placed', 'staff'))];
      if (order.email) jobs.push(sendOne(payloadFor(order, 'placed', 'customer')));
      return Promise.all(jobs).then(function (results) { return results.length > 0 && results.every(Boolean); }).catch(function () { return false; });
    } catch (error) {
      if (root.console && root.console.warn) root.console.warn('Order email build failed', error && error.message);
      return Promise.resolve(false);
    }
  }
  function status(order, state) {
    try {
      if (!order || !order.email || !STATUS[state] || state === 'placed') return Promise.resolve(false);
      return sendOne(payloadFor(order, state, 'customer')).then(Boolean).catch(function () { return false; });
    } catch (error) {
      if (root.console && root.console.warn) root.console.warn('Order status email failed', error && error.message);
      return Promise.resolve(false);
    }
  }
  root.STMOrderEmails = { send: send, status: status, render: render };
})(typeof window !== 'undefined' ? window : globalThis);
