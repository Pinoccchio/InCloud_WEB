Console Error


Error updating order status: {}

src/app/admin/orders/components/OrderDetailsModal.tsx (368:15) @ updateOrderStatus


  366 |
  367 |     } catch (err) {
> 368 |       console.error('Error updating order status:', err)
      |               ^
  369 |       addToast({
  370 |         type: 'error',
  371 |         title: 'Failed to update order status',
Call Stack
4

Show 3 ignore-listed frame(s)
updateOrderStatus
src/app/admin/orders/components/OrderDetailsModal.tsx (368:15)