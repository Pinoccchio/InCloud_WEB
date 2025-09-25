# Sample Product Data for InCloud System

## Product 1: Pork Kawali

### Basic Information:
- **Product Name**: Pork Kawali Sliced 500g
- **SKU**: PKW-500G-001
- **Barcode**: 4800123456789 *(leave empty if you want to generate later)*
- **Description**: Premium pork belly sliced for kawali, flash-frozen to preserve freshness and flavor. Perfect for crispy kawali dishes.
- **Unit of Measure**: Pieces
- **Category**: Frozen Meat *(from dropdown)*
- **Brand**: Prime Cuts *(from dropdown)*
- **Status**: Active *(auto-selected)*
- **Is Frozen**: Yes *(auto-detected from "Frozen Meat" category)*

### Pricing Tiers:
- **Retail**: ₱280.00 per piece
- **Wholesale**: ₱250.00 per piece *(min: 10 pieces)*
- **Box**: ₱230.00 per piece *(min: 20 pieces)*

---

## Product 2: Pork Tapa

### Basic Information:
- **Product Name**: Pork Tapa Marinated 300g
- **SKU**: PTP-300G-001
- **Barcode**: 4800123456796 *(leave empty if you want to generate later)*
- **Description**: Tender pork shoulder marinated in traditional sweet-savory tapa sauce, ready to cook. Authentic Filipino breakfast favorite.
- **Unit of Measure**: Packs
- **Category**: Frozen Meat *(from dropdown)*
- **Brand**: Prime Cuts *(from dropdown)*
- **Status**: Active *(auto-selected)*
- **Is Frozen**: Yes *(auto-detected from "Frozen Meat" category)*

### Pricing Tiers:
- **Retail**: ₱180.00 per pack
- **Wholesale**: ₱160.00 per pack *(min: 15 packs)*
- **Box**: ₱145.00 per pack *(min: 30 packs)*

---

## 📦 Add Stock Workflow Guide

### How to Add Stock for Products

After creating products, use the **"Add Stock"** button in the Inventory section to add initial inventory:

### Step 1: Stock Details
1. **Select Product**: Choose from dropdown (e.g., "Pork Kawali Sliced 500g")
2. **Quantity**: Enter number of units to add
3. **Cost per Unit**: Enter your purchase cost (wholesale/supplier cost)
4. **Expiration Date**: Set when this batch expires
5. **Received Date**: Today's date (auto-filled)

### Step 2: Supplier Information
1. **Supplier Name**: Company/person you bought from
2. **Supplier Contact**: Phone number
3. **Supplier Email**: Email address (optional)
4. **Batch Number**: Your internal tracking code
5. **Purchase Order Reference**: PO number (optional)
6. **Notes**: Additional details (optional)

### Step 3: Review & Submit
- Review all details before submitting
- System creates inventory record and product batch
- Stock levels update automatically

---

## 📋 Sample Add Stock Data

### For Pork Kawali (First Stock Addition):

**Step 1 - Stock Details:**
- **Product**: Pork Kawali Sliced 500g
- **Quantity**: 50
- **Cost per Unit**: 200
- **Expiration Date**: 2025-09-26
- **Received Date**: 2025-03-26

**Step 2 - Supplier Information:**
- **Supplier Name**: Manila Meat Suppliers
- **Supplier Contact**: +63-917-123-4567
- **Supplier Email**: orders@manilameat.com
- **Batch Number**: PKW-BATCH-001
- **Purchase Order Reference**: PO-2025-001
- **Notes**: First batch delivery, good quality frozen pork belly

### For Pork Tapa (First Stock Addition):

**Step 1 - Stock Details:**
- **Product**: Pork Tapa Marinated 300g
- **Quantity**: 75
- **Cost per Unit**: 120
- **Expiration Date**: 2025-07-26
- **Received Date**: 2025-03-26

**Step 2 - Supplier Information:**
- **Supplier Name**: Tapa Masters Corp
- **Supplier Contact**: +63-918-765-4321
- **Supplier Email**: supply@tapamasters.ph
- **Batch Number**: PTP-BATCH-001
- **Purchase Order Reference**: PO-2025-002
- **Notes**: Premium marinated pork tapa, ready to cook

### Expected Results After Adding Stock:
- **Inventory Table**: Shows products with stock quantities
- **Total Products**: 1 (or 2 when both added)
- **Stock Status**: "Healthy" (green indicator)
- **FIFO Batches**: Created for expiration tracking
- **Cost Tracking**: Purchase costs recorded for profit analysis

---

## Key Status & Description Notes:

### Status Field:
- **Default**: Active *(recommended for new products)*
- **Options**: Active, Inactive, Discontinued
- **Active**: Product is available for sale and inventory management
- **Inactive**: Product exists but not available for new orders
- **Discontinued**: Product is being phased out

### Description Field Guidelines:
- **Be Descriptive**: Include cooking method, preparation, size/weight
- **Add Appeal**: Mention taste, quality, or special features
- **Keep Concise**: 1-2 sentences that sell the product
- **Include Usage**: What dishes or meals it's perfect for

### Frozen Status:
- **Auto-Detection**: Selecting "Frozen Meat" category automatically sets frozen status
- **No Manual Checkbox**: System intelligently determines from category selection
- **Categories**: "Frozen Meat", "Frozen Seafood" → frozen = true