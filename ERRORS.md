Console ReferenceError


now is not defined

src/app/admin/inventory/components/RestockModal.tsx (416:35) @ handleSubmit


  414 |
  415 |       // Check if dates are too far in the past or future (business rule)
> 416 |       const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      |                                   ^
  417 |       const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
  418 |
  419 |       if (receivedDate < oneYearAgo) {
Call Stack
1

handleSubmit
src/app/admin/inventory/components/RestockModal.tsx (416:35)