# Order Processing

This guide explains the complete order lifecycle in FoodBase, from creation to delivery.

## Order States

Orders in FoodBase progress through the following states:

1. **Pending**: Order received but not yet accepted by the restaurant
2. **Accepted**: Restaurant has confirmed the order
3. **Preparing**: Food is being prepared
4. **Ready for Pickup**: Order is ready for the driver
5. **In Transit**: Driver has picked up the order and is en route
6. **Delivered**: Order has been delivered to the customer
7. **Cancelled**: Order was cancelled (can happen at various stages)

## Viewing Orders

To view all orders:

1. Navigate to the **Orders** page from the main menu
2. Use filters to narrow down orders by:
   - Status
   - Date range
   - Restaurant
   - Customer
   - Driver

Each order card displays:
- Order ID
- Restaurant name
- Customer name
- Order total
- Current status
- Timestamp

## Order Details

Click on any order to view its details:

- **Customer Information**: Name, address, contact details
- **Order Items**: List of items with quantities and prices
- **Payment Details**: Method, amount, transaction ID
- **Delivery Information**: Driver assigned, estimated delivery time
- **Status History**: Timeline of status changes
- **Notes**: Special instructions or comments

## Processing Orders (Restaurant View)

As a restaurant owner or staff:

1. Go to the **Orders** page
2. Filter by your restaurant if needed
3. New orders appear in the **Pending** section
4. To accept an order:
   - Click on the order
   - Review the details
   - Click **Accept Order**
   - Set an estimated preparation time
5. Update the status as the order progresses:
   - Click **Update Status**
   - Select the new status
   - Add notes if necessary

## Assigning Drivers

To assign a driver to an order:

1. Open the order details
2. Click **Assign Driver**
3. View available drivers in the area
4. Select a driver from the list
5. The driver will receive a notification

## Tracking Deliveries

Once a driver is assigned:

1. The order status will update as the driver progresses
2. Real-time location tracking is available on the order details page
3. Estimated arrival times are automatically updated
4. Both the restaurant and administrators can track all active deliveries

## Handling Issues

If problems occur during the order process:

1. Open the problematic order
2. Click **Report Issue**
3. Select the issue type:
   - Payment problem
   - Item unavailable
   - Delivery delay
   - Customer complaint
4. Add details about the issue
5. Submit the report
6. The system will guide you through resolution steps

## Order Analytics

Order data is used to generate insights:

- Average preparation time
- Delivery efficiency
- Popular ordering times
- Common order combinations

Access these analytics through the **Analytics** page.
