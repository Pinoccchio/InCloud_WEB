Console Error


❌ Database function failed: {}

src/app/admin/products/components/ProductForm.tsx (403:17) @ createProduct


  401 |
  402 |       if (functionError) {
> 403 |         console.error('❌ Database function failed:', functionError)
      |                 ^
  404 |         logSupabaseError(functionError, 'create_product_with_inventory RPC call')
  405 |         throw functionError
  406 |       }
Call Stack
5

Show 3 ignore-listed frame(s)
createProduct
src/app/admin/products/components/ProductForm.tsx (403:17)
async handleSubmit
src/app/admin/products/components/ProductForm.tsx (334:9)Console Error


❌ Error in create_product_with_inventory RPC call
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Message: cannot get array length of a scalar
Code: 22023

Error Type:
  • General database error

Full Error Object:
{
  "code": "22023",
  "details": null,
  "hint": null,
  "message": "cannot get array length of a scalar"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/lib/utils/supabase-errors.ts (176:11) @ logSupabaseError


  174 |   const parsed = parseSupabaseError(error)
  175 |   const formatted = formatErrorForConsole(parsed, context)
> 176 |   console.error(formatted)
      |           ^
  177 |   return parsed
  178 | }
  179 |
Call Stack
6

Show 3 ignore-listed frame(s)
logSupabaseError
src/lib/utils/supabase-errors.ts (176:11)
createProduct
src/app/admin/products/components/ProductForm.tsx (404:25)
async handleSubmit
src/app/admin/products/components/ProductForm.tsx (334:9)Console Error


❌ Error in Database function fallback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Message: cannot get array length of a scalar
Code: 22023

Error Type:
  • General database error

Full Error Object:
{
  "code": "22023",
  "details": null,
  "hint": null,
  "message": "cannot get array length of a scalar"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/lib/utils/supabase-errors.ts (176:11) @ logSupabaseError


  174 |   const parsed = parseSupabaseError(error)
  175 |   const formatted = formatErrorForConsole(parsed, context)
> 176 |   console.error(formatted)
      |           ^
  177 |   return parsed
  178 | }
  179 |
Call Stack
6

Show 3 ignore-listed frame(s)
logSupabaseError
src/lib/utils/supabase-errors.ts (176:11)
createProduct
src/app/admin/products/components/ProductForm.tsx (434:23)
async handleSubmit
src/app/admin/products/components/ProductForm.tsx (334:9)