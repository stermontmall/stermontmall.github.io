/*
 * order-emails.js (Stermont Arcade)
 * EmailJS emails for orders (service_zoho, sent from support@stermontarcade.co.ke).
 *   STMOrderEmails.send(payload, data)  after checkout saves an order: customer confirmation + staff alert
 *   STMOrderEmails.status(order, state) from the admin orders page: customer status email
 *       state = confirmed | packed | delivered | declined
 * Never throws: a failed email must not break an order or an admin action. Promises resolve to true/false.
 */
(function () {
  'use strict';
  var CFG = {
    key: 'PayiXKhM6gVQLHYAE', service: 'service_zoho', tpl: 'template_n60yao4',
    staff: 'support@stermontarcade.co.ke', site: 'https://stermontarcade.co.ke', wa: '254789514060'
  };
  var F = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;";
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return 'KSh ' + Number(n || 0).toLocaleString('en-KE'); }

  function rows(items) {
    return (items || []).map(function (i) {
      return '<tr><td style="padding:10px 0;border-bottom:1px solid #eee7fb;' + F + 'font-size:15px;color:#1b1230;">' + esc(i.name) +
        '<div style="font-size:12px;color:#8a7fa8;padding-top:2px;">Qty ' + esc(i.qty) + '</div></td>' +
        '<td align="right" style="padding:10px 0;border-bottom:1px solid #eee7fb;' + F + 'font-size:15px;font-weight:700;color:#1b1230;white-space:nowrap;">' + esc(money(i.total)) + '</td></tr>';
    }).join('');
  }
  function shell(title, sub, inner) {
    return '<div style="background:#efe7ff;padding:24px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-radius:20px;overflow:hidden;background:#ffffff;">' +
      '<tr><td align="center" bgcolor="#5b21b6" style="background:#5b21b6;padding:28px 22px;"><div style="' + F + 'font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#e9ddff;">Stermont Arcade</div>' +
      '<div style="' + F + 'font-size:26px;font-weight:900;color:#ffffff;padding-top:14px;">' + title + '</div>' +
      '<div style="' + F + 'font-size:15px;color:#e9ddff;padding-top:8px;">' + sub + '</div></td></tr>' + inner +
      '<tr><td align="center" bgcolor="#2a0e5c" style="background:#2a0e5c;padding:18px 22px;' + F + 'font-size:12px;line-height:1.7;color:#cdbdf3;">Stermont Arcade &middot; +254 789 514 060 &middot; support@stermontarcade.co.ke<br><a href="' + CFG.site + '" style="color:#c8f31d;text-decoration:none;">stermontarcade.co.ke</a></td></tr></table></div>';
  }
  function btn(href, label, bg, fg) {
    return '<a href="' + href + '" style="display:inline-block;background:' + bg + ';color:' + fg + ';' + F + 'font-size:15px;font-weight:800;text-decoration:none;padding:13px 22px;border-radius:12px;margin:4px;">' + label + '</a>';
  }
  function send(params) {
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: CFG.service, template_id: CFG.tpl, user_id: CFG.key, template_params: params })
    }).then(function (r) {
      if (r.ok) return true;
      return r.text().then(function (t) { console.warn('EmailJS failed', r.status, t); return false; });
    }).catch(function (e) { console.warn('EmailJS error', e && e.message); return false; });
  }

  function sendAll(p, d) {
    var ref = d.ref || p.p_ref, total = money(d.subtotal), items = d.items || [];
    var where = p.p_method === 'pickup' ? 'Collect at Stermont Arcade, Sarit Centre, Westlands' : 'Deliver to ' + (p.p_address || '') + ', ' + (p.p_county || '');
    var track = CFG.site + '/track.html?ref=' + encodeURIComponent(ref);
    var itemText = items.map(function (i, k) { return (k + 1) + '. ' + i.name + ' x' + i.qty + ' = ' + money(i.total); }).join('\n');
    var jobs = [];

    if (p.p_email) {
      var custInner =
        '<tr><td style="padding:24px 24px 6px;"><div style="' + F + 'font-size:18px;font-weight:800;color:#1b1230;">Hi ' + esc(p.p_customer_name) + ',</div>' +
        '<p style="' + F + 'font-size:15px;line-height:1.65;color:#4a4163;margin:10px 0 0;">Thank you for your order. We have received your M-Pesa code <b>' + esc(p.p_pay_code) + '</b> and will verify the payment. We will contact you on WhatsApp to confirm your order and ' + (p.p_method === 'pickup' ? 'collection' : 'delivery') + '. Your order is confirmed only after the payment is verified.</p></td></tr>' +
        '<tr><td style="padding:14px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border:1px solid #e6dcfb;border-radius:16px;"><tr><td style="padding:14px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows(items) + '</table></td></tr>' +
        '<tr><td style="padding:6px 16px 16px;"><table role="presentation" width="100%"><tr><td style="' + F + 'font-size:16px;font-weight:700;color:#1b1230;">Total</td><td align="right" style="' + F + 'font-size:22px;font-weight:900;color:#5b21b6;">' + esc(total) + '</td></tr></table></td></tr></table></td></tr>' +
        '<tr><td style="padding:0 24px;' + F + 'font-size:14px;color:#1b1230;"><b>' + (p.p_method === 'pickup' ? 'Collection' : 'Delivery') + ':</b> ' + esc(where) + '</td></tr>' +
        '<tr><td align="center" style="padding:18px 24px 24px;">' + btn(track, 'Track your order', '#7c3aed', '#ffffff') + btn('https://wa.me/' + CFG.wa, 'Message us on WhatsApp', '#c8f31d', '#2a0e5c') + '</td></tr>';
      jobs.push(send({
        to_email: p.p_email, reply_to: CFG.staff, subject: 'We received your order ' + ref, business: 'Stermont Arcade', order_ref: ref,
        name: p.p_customer_name, headline: 'We received your order', items: itemText, total: total, order_items: itemText, order_total: total,
        customer_name: p.p_customer_name, customer_phone: p.p_phone, delivery: where, mpesa_code: p.p_pay_code,
        message: 'Thank you for your order ' + ref + '. Track it here: ' + track, buttons: '', phone: '+254 789 514 060', web: 'stermontarcade.co.ke',
        html_body: shell('We received your order', 'Order <b style="color:#c8f31d;">' + esc(ref) + '</b> is being verified', custInner)
      }));
    }

    var adm = CFG.site + '/neon-admin-orders.html?ref=' + encodeURIComponent(ref);
    var staffInner =
      '<tr><td style="padding:22px 24px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border:1px solid #e6dcfb;border-radius:16px;"><tr><td style="padding:14px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows(items) + '</table></td></tr>' +
      '<tr><td style="padding:6px 16px 16px;"><table role="presentation" width="100%"><tr><td style="' + F + 'font-size:16px;font-weight:700;color:#1b1230;">Order total</td><td align="right" style="' + F + 'font-size:22px;font-weight:900;color:#5b21b6;">' + esc(total) + '</td></tr></table></td></tr></table></td></tr>' +
      '<tr><td style="padding:10px 24px;' + F + 'font-size:14px;line-height:1.7;color:#1b1230;"><b>Customer:</b> ' + esc(p.p_customer_name) + '<br><b>Phone:</b> <a href="tel:' + esc(p.p_phone) + '">' + esc(p.p_phone) + '</a>' + (p.p_email ? '<br><b>Email:</b> ' + esc(p.p_email) : '') +
      '<br><b>' + (p.p_method === 'pickup' ? 'Collection' : 'Delivery') + ':</b> ' + esc(where) + (p.p_notes ? '<br><b>Notes:</b> ' + esc(p.p_notes) : '') +
      '<br><b>M-Pesa code entered:</b> <span style="font-family:Courier New,monospace;font-weight:800;">' + esc(p.p_pay_code) + '</span> (customer says paid ' + esc(money(p.p_pay_amount)) + ')</td></tr>' +
      '<tr><td style="padding:4px 24px;"><div style="background:#fff8e6;border:1px solid #fde4a3;border-radius:12px;padding:12px 14px;' + F + 'font-size:13px;color:#6b4a00;"><b>Pending verification.</b> Check your M-Pesa SMS for this code and amount before approving.</div></td></tr>' +
      '<tr><td align="center" style="padding:16px 24px 24px;">' + btn(adm, 'Open in admin', '#c8f31d', '#2a0e5c') + btn('https://wa.me/' + String(p.p_phone || '').replace(/\D/g, ''), 'WhatsApp customer', '#25d366', '#ffffff') + '</td></tr>';
    jobs.push(send({
      to_email: CFG.staff, reply_to: p.p_email || CFG.staff, subject: 'New order ' + total + ' - ' + p.p_customer_name + ' (' + ref + ')', business: 'Stermont Arcade', order_ref: ref,
      name: 'Stermont team', headline: 'New order to verify', items: itemText, total: total, order_items: itemText, order_total: total,
      customer_name: p.p_customer_name, customer_phone: p.p_phone, delivery: where, mpesa_code: p.p_pay_code,
      message: 'New order ' + ref + ' from ' + p.p_customer_name + ' ' + p.p_phone + '. M-Pesa code ' + p.p_pay_code + '.', buttons: '', phone: '+254 789 514 060', web: 'stermontarcade.co.ke',
      html_body: shell('New order!', 'Order <b style="color:#c8f31d;">' + esc(ref) + '</b> &middot; ' + esc(total), staffInner)
    }));
    return Promise.all(jobs);
  }

  /* Customer status email, sent when staff move an order along (orders row from the Neon Data API) */
  function statusMail(o, state) {
    if (!o || !o.email) return Promise.resolve(false);
    var pick = o.method === 'pickup', ref = o.ref, track = CFG.site + '/track.html?ref=' + encodeURIComponent(ref);
    var T = {
      confirmed: ['Payment verified', 'Your order is confirmed', 'We have verified your payment and confirmed your order. We are now preparing it.'],
      packed: ['Order packed', 'Your order is packed', pick ? 'Your order is packed and ready for collection at Stermont Arcade, Sarit Centre, Westlands (open daily 8:00 AM to 8:00 PM).' : 'Your order is packed and will be dispatched for delivery shortly. We will contact you on WhatsApp.'],
      delivered: [pick ? 'Collected' : 'Delivered', pick ? 'Order collected' : 'Your order has been delivered', pick ? 'Thank you for collecting your order. We hope you are happy with it.' : 'Your order has been delivered. Thank you for shopping with us. If anything is wrong, message us on WhatsApp.'],
      declined: ['Payment not verified', 'We could not verify your payment', 'We could not match your M-Pesa payment to this order. Please message us on WhatsApp with your M-Pesa SMS and we will sort it out quickly.']
    }[state];
    if (!T) return Promise.resolve(false);
    var items = o.items || [], itemText = items.map(function (i, k) { return (k + 1) + '. ' + i.name + ' x' + i.qty + ' = ' + money(i.total); }).join('\n');
    var inner =
      '<tr><td style="padding:24px 24px 6px;"><div style="' + F + 'font-size:18px;font-weight:800;color:#1b1230;">Hi ' + esc(o.customer_name) + ',</div>' +
      '<p style="' + F + 'font-size:15px;line-height:1.65;color:#4a4163;margin:10px 0 0;">' + esc(T[2]) + '</p></td></tr>' +
      '<tr><td style="padding:14px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border:1px solid #e6dcfb;border-radius:16px;"><tr><td style="padding:14px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows(items) + '</table></td></tr>' +
      '<tr><td style="padding:6px 16px 16px;"><table role="presentation" width="100%"><tr><td style="' + F + 'font-size:16px;font-weight:700;color:#1b1230;">Total</td><td align="right" style="' + F + 'font-size:22px;font-weight:900;color:#5b21b6;">' + esc(money(o.subtotal)) + '</td></tr></table></td></tr></table></td></tr>' +
      '<tr><td align="center" style="padding:14px 24px 24px;">' + btn(track, 'Track your order', '#7c3aed', '#ffffff') + btn('https://wa.me/' + CFG.wa, 'Message us on WhatsApp', '#c8f31d', '#2a0e5c') + '</td></tr>';
    return send({
      to_email: o.email, reply_to: CFG.staff, subject: T[1] + ' - order ' + ref, business: 'Stermont Arcade', order_ref: ref, name: o.customer_name,
      headline: T[1], items: itemText, total: money(o.subtotal), order_items: itemText, order_total: money(o.subtotal), customer_name: o.customer_name,
      customer_phone: o.phone, delivery: pick ? 'Collection' : 'Delivery to ' + (o.address || '') + ', ' + (o.county || ''), mpesa_code: o.pay_code || '',
      message: T[2] + ' Track it here: ' + track, buttons: '', phone: '+254 789 514 060', web: 'stermontarcade.co.ke',
      html_body: shell(T[1], 'Order <b style="color:#c8f31d;">' + esc(ref) + '</b> &middot; ' + esc(T[0]), inner)
    });
  }

  window.STMOrderEmails = {
    send: function (payload, data) {
      try { return sendAll(payload || {}, data || {}).catch(function () { return []; }); } catch (e) { return Promise.resolve([]); }
    },
    status: function (order, state) {
      try { return statusMail(order, state).catch(function () { return false; }); } catch (e) { return Promise.resolve(false); }
    }
  };
})();
