const Order = require("../models/Order");

const INTERVAL_MS = 5000; // 5 seconds
const MOVEMENT_OFFSET = 0.001; // approximately 100 meters per tick simulation

async function simulateGpsMovement() {
  try {
    // Find all orders that are currently out_for_delivery
    const orders = await Order.find({ status: "out_for_delivery" });

    for (let order of orders) {
      if (!order.location) {
        order.location = { lat: 21.1458, lng: 79.0882 };
      }

      // Randomly move lat and lng a tiny bit
      const latChange = (Math.random() - 0.5) * MOVEMENT_OFFSET;
      const lngChange = (Math.random() - 0.5) * MOVEMENT_OFFSET;

      order.location.lat += latChange;
      order.location.lng += lngChange;

      // Disable validation just to do a fast save for location update
      // so it doesn't trigger unrelated mongoose validations on timestamps
      await Order.updateOne(
        { _id: order._id },
        { $set: { location: order.location } }
      );
    }
    
    if (orders.length > 0) {
      console.log(`[GPS] Updated coordinates for ${orders.length} out_for_delivery orders.`);
    }
  } catch (error) {
    console.error(`[GPS] Simulation Error:`, error.message);
  }
}

function startGpsSimulation() {
  console.log(`[GPS] Simulation starting. Interval: ${INTERVAL_MS}ms`);
  setInterval(simulateGpsMovement, INTERVAL_MS);
}

module.exports = { startGpsSimulation };
