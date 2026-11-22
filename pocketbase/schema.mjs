// PocketBase collections for the interim shop backend (PocketBase v0.23+).
// Access rules mirror the Supabase RLS policies, with three deliberate security improvements:
//   1. Wholesale cost lives in its own staff-only collection (in Supabase anon can read products.cost).
//   2. Nobody can give themselves the "staff" role when signing up or editing their profile.
//   3. Customers cannot set order status / payment-verified fields when placing an order.

export const STAFF = '@request.auth.role = "staff"';

const t = (name, o = {}) => ({ name, type: 'text', ...o });
const n = (name, o = {}) => ({ name, type: 'number', ...o });
const b = name => ({ name, type: 'bool' });
const j = name => ({ name, type: 'json', maxSize: 5000000 });
const d = name => ({ name, type: 'date' });
const long = name => t(name, { max: 100000 });

// System fields. setup.mjs retries without these if the server already adds them itself.
export const SYSTEM_FIELDS = [
  { name: 'id', type: 'text', primaryKey: true, required: true, system: true, min: 15, max: 15, pattern: '^[a-z0-9]+$', autogeneratePattern: '[a-z0-9]{15}' },
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
  { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
];

export const collections = [
  {
    name: 'categories',
    fields: [n('cat_id', { required: true }), t('name'), t('slug'), n('parent_id'), n('sort_order'), b('is_promo'), t('top_label'), n('top_sort'),
      t('image_url'), long('description'), t('meta_title'), t('meta_description'), j('keywords')],
    indexes: ['CREATE UNIQUE INDEX idx_categories_cat_id ON categories (cat_id)', 'CREATE INDEX idx_categories_slug ON categories (slug)'],
    listRule: '', viewRule: '', createRule: STAFF, updateRule: STAFF, deleteRule: STAFF,
  },
  {
    name: 'products',
    fields: [t('pid', { required: true }), n('category_id'), t('name'), n('price'), n('stock'), n('low_at'), b('featured'), b('active'), j('images'),
      long('description'), n('old_price'), t('unit'), t('variant_group'), t('variant_label'), t('slug'), t('seo_name'), t('seo_title'),
      t('gtin'), t('mpn'), t('meta_title'), t('meta_description'), t('alt_text'), j('keywords'), t('stock_status'), t('product_code'), d('created_at')],
    indexes: ['CREATE UNIQUE INDEX idx_products_pid ON products (pid)', 'CREATE INDEX idx_products_slug ON products (slug)',
      'CREATE INDEX idx_products_category ON products (category_id)', 'CREATE INDEX idx_products_active ON products (active)'],
    listRule: `active = true || ${STAFF}`, viewRule: `active = true || ${STAFF}`, createRule: STAFF, updateRule: STAFF, deleteRule: STAFF,
  },
  {
    // Wholesale cost: staff only. NOT public (see note 1 above).
    name: 'product_costs',
    fields: [t('pid', { required: true }), n('cost')],
    indexes: ['CREATE UNIQUE INDEX idx_product_costs_pid ON product_costs (pid)'],
    listRule: STAFF, viewRule: STAFF, createRule: STAFF, updateRule: STAFF, deleteRule: STAFF,
  },
  {
    name: 'vouchers',
    fields: [t('code', { required: true }), t('kind'), n('value'), n('min_order'), n('max_uses'), n('used_count'), d('starts_at'), d('expires_at'),
      b('active'), b('public_offer'), t('note'), t('created_by'), b('first_order_only')],
    indexes: ['CREATE UNIQUE INDEX idx_vouchers_code ON vouchers (code)'],
    // Staff only for now. A public "check voucher" endpoint is a later pb_hooks task.
    listRule: STAFF, viewRule: STAFF, createRule: STAFF, updateRule: STAFF, deleteRule: STAFF,
  },
  {
    name: 'orders',
    fields: [t('ref', { required: true }), t('user_id'), t('customer_name'), t('phone'), t('email'), t('method'), t('county'), t('address'), long('notes'),
      j('items'), n('subtotal'), t('status'), t('handled_by'), d('handled_at'), t('stage'), t('pay_code'), n('pay_amount'), t('voucher_code'),
      n('discount'), b('pay_verified'), t('review_key'), d('created_at')],
    indexes: ['CREATE UNIQUE INDEX idx_orders_ref ON orders (ref)', 'CREATE INDEX idx_orders_user ON orders (user_id)'],
    listRule: `(user_id != "" && user_id = @request.auth.id) || ${STAFF}`,
    viewRule: `(user_id != "" && user_id = @request.auth.id) || ${STAFF}`,
    // Anyone may place an order, but only staff may set handling/payment fields, and a customer may only attach their own user id.
    createRule: '@request.body.status:isset = false && @request.body.pay_verified:isset = false && @request.body.handled_by:isset = false && '
      + '@request.body.handled_at:isset = false && @request.body.stage:isset = false && '
      + '(@request.body.user_id = "" || @request.body.user_id = @request.auth.id)',
    updateRule: STAFF, deleteRule: STAFF,
  },
  {
    name: 'reviews',
    fields: [t('user_id'), t('order_ref'), t('product_name'), n('rating'), long('body'), t('reviewer'), t('status'), d('created_at')],
    indexes: ['CREATE INDEX idx_reviews_status ON reviews (status)'],
    listRule: `status = "approved" || (user_id != "" && user_id = @request.auth.id) || ${STAFF}`,
    viewRule: `status = "approved" || (user_id != "" && user_id = @request.auth.id) || ${STAFF}`,
    createRule: '@request.auth.id != "" && @request.body.user_id = @request.auth.id && @request.body.status = "pending"',
    updateRule: STAFF, deleteRule: STAFF,
  },
  {
    name: 'product_slug_redirects',
    fields: [t('old_slug', { required: true }), t('product_id')],
    indexes: ['CREATE UNIQUE INDEX idx_slug_redirects_old ON product_slug_redirects (old_slug)'],
    listRule: '', viewRule: '', createRule: STAFF, updateRule: STAFF, deleteRule: STAFF,
  },
];

// Built-in "users" collection: add a role and stop people granting themselves staff.
export const usersPatch = {
  extraField: { name: 'role', type: 'select', values: ['customer', 'staff'], maxSelect: 1 },
  // Sign-up may not pick a role; users may edit their own profile but never their role.
  // Staff are created by the owner in the PocketBase admin UI (superuser), which ignores these rules.
  createRule: '@request.body.role:isset = false',
  updateRule: 'id = @request.auth.id && @request.body.role:isset = false',
};
