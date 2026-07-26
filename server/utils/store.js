const Product = require('../models/product');
const taxConfig = require('../config/tax');

// Shared cart/order helpers: bulk product deactivation (used by the brand
// and category "deactivate cascades") plus tax/total calculations used both
// at checkout (caculateItemsSalesTax) and when displaying an existing order
// (caculateTaxAmount/caculateOrderTotal/formatOrders). Function names keep
// the "caculate" typo (missing the second "l") consistently — worth knowing
// if you go looking for "calculate" and don't find these.
exports.disableProducts = products => {
  let bulkOptions = products.map(item => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { isActive: false }
      }
    };
  });

  Product.bulkWrite(bulkOptions);
};

// Recomputes tax/totals for an already-placed order, e.g. when displaying
// it or after an item gets cancelled (order.js re-derives totals rather than
// storing a stale value).
exports.caculateTaxAmount = order => {
  try {
    const taxRate = taxConfig.stateTaxRate;

    order.totalTax = 0;
    if (order.products && order.products.length > 0) {
      order.products.map(item => {
        const price = item.purchasePrice || (item?.product?.price ?? 0);
        const quantity = item.quantity;
        item.totalPrice = price * quantity;
        item.purchasePrice = price;

        if (item.status !== 'Cancelled') {
          if (item.product?.taxable && item.priceWithTax === 0) {
            // (taxRate / 100) * 100 cancels out to just `taxRate` —
            // `stateTaxRate` (e.g. 0.05) is already a fraction, not a
            // whole-number percentage, so no conversion is actually needed.
            const taxAmount = price * (taxRate / 100) * 100;
            item.totalTax = parseFloat(
              Number((taxAmount * quantity).toFixed(2))
            );

            order.totalTax += item.totalTax;
          } else {
            order.totalTax += item.totalTax;
          }
        }

        item.priceWithTax = parseFloat(
          Number((item.totalPrice + item.totalTax).toFixed(2))
        );
      });
    }

    // Redundant: `order.total` gets recomputed here if there are any
    // cancelled items, then unconditionally recomputed again right below
    // (currentTotal is always freshly calculated, so `currentTotal !==
    // order.total` is comparing the just-set value or the original one —
    // either way this second block always ends up reassigning the same
    // result the first block would have produced).
    const hasCancelledItems = order.products.filter(
      item => item.status === 'Cancelled'
    );

    if (hasCancelledItems.length > 0) {
      order.total = this.caculateOrderTotal(order);
    }

    const currentTotal = this.caculateOrderTotal(order);

    if (currentTotal !== order.total) {
      order.total = this.caculateOrderTotal(order);
    }

    order.totalWithTax = order.total + order.totalTax;
    order.total = parseFloat(Number(order.total.toFixed(2)));
    order.totalTax = parseFloat(
      Number(order.totalTax && order.totalTax.toFixed(2))
    );
    order.totalWithTax = parseFloat(Number(order.totalWithTax.toFixed(2)));
    return order;
  } catch (error) {
    return order;
  }
};

// Sum of totalPrice across all non-cancelled line items.
exports.caculateOrderTotal = order => {
  const total = order.products
    .filter(item => item.status !== 'Cancelled')
    .reduce((sum, current) => sum + current.totalPrice, 0);

  return total;
};

// Checkout-time tax calculation: stamps each cart line item with its price/
// tax at the moment of purchase (see routes/api/cart.js POST /add), so later
// tax-rate changes don't retroactively affect already-placed orders.
exports.caculateItemsSalesTax = items => {
  const taxRate = taxConfig.stateTaxRate;

  const products = items.map(item => {
    item.priceWithTax = 0;
    item.totalPrice = 0;
    item.totalTax = 0;
    item.purchasePrice = item.price;

    const price = item.purchasePrice;
    const quantity = item.quantity;
    item.totalPrice = parseFloat(Number((price * quantity).toFixed(2)));

    if (item.taxable) {
      const taxAmount = price * (taxRate / 100) * 100;

      item.totalTax = parseFloat(Number((taxAmount * quantity).toFixed(2)));
      item.priceWithTax = parseFloat(
        Number((item.totalPrice + item.totalTax).toFixed(2))
      );
    }

    return item;
  });

  return products;
};

// Shapes a list of populated Order documents (cart -> products -> brand)
// down to the flat fields the order-list UI needs, running each through
// caculateTaxAmount along the way.
exports.formatOrders = orders => {
  const newOrders = orders.map(order => {
    return {
      _id: order._id,
      total: parseFloat(Number(order.total.toFixed(2))),
      created: order.created,
      products: order?.cart?.products
    };
  });

  return newOrders.map(order => {
    return order?.products ? this.caculateTaxAmount(order) : order;
  });
};
