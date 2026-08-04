module.exports = {
  app: {
    name: 'Commerce Service',
    apiURL: `${process.env.BASE_API_URL}`
  },
  port: process.env.PORT || 3103,
  database: {
    url: process.env.MONGO_URI
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    tokenLife: '7d'
  },
  // Base URL of notification_server, used for the fire-and-forget order
  // confirmation email call in routes/api/order.js.
  notificationURL: process.env.NOTIFICATION_URL
};
