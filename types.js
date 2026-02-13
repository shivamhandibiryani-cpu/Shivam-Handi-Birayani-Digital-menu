
/**
 * @typedef {'All' | 'Biryani' | 'Arabic Food' | 'Rice' | 'Khana' | 'Pizza' | 'Burger' | 'Curry & Snacks' | 'Chicken Item' | 'Chowmin' | 'Momo' | 'Nanglo Sets' | 'Pasta'} Category
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} name
 * @property {'Biryani' | 'Arabic Food' | 'Rice' | 'Khana' | 'Pizza' | 'Burger' | 'Curry & Snacks' | 'Chicken Item' | 'Chowmin' | 'Momo' | 'Nanglo Sets' | 'Pasta'} category
 * @property {number} price
 * @property {number} rating
 * @property {string} description
 * @property {string} image
 */

/**
 * @typedef {MenuItem & {quantity: number}} CartItem
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {CartItem[]} items
 * @property {number} total
 * @property {'Pending' | 'Preparing' | 'Completed' | 'Cancelled'} status
 * @property {string} tableNumber
 * @property {string} customerName
 * @property {string} contactNumber
 * @property {string} extraToppings
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AnalyticsData
 * @property {string} name
 * @property {number} orders
 * @property {number} revenue
 */
