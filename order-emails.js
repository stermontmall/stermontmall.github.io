/*
 * order-emails.js (Stermont Arcade)
 * Sends the two order emails after checkout.html has saved an order in Neon:
 *   1. Customer confirmation (only when the customer entered an email)
 *   2. Staff alert to support@stermontarcade.co.ke
 * Uses EmailJS (service_zoho, sends from support@) with the same public key and template the old
 * checkout used. Never throws: a failed email must not break a placed order.
 * Usage: window.STMOrderEmails.send(payload, data)
 *   payload = the p_* object sent to rpc/create_guest_order, data = its JSON reply.
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

    var adm = CFG.site + '/admin.html?ref=' + encodeURIComponent(ref);
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

  window.STMOrderEmails = {
    send: function (payload, data) {
      try { return sendAll(payload || {}, data || {}).catch(function () { return []; }); } catch (e) { return Promise.resolve([]); }
    }
  };
})();
