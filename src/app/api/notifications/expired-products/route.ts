import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ExpiredBatchRow {
  id: string
  batch_number: string
  quantity: number
  expiration_date: string
  inventory: {
    id: string
    branch_id: string
    product_id: string
    products: {
      id: string
      name: string
    } | null
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess(user.id)
    if (!authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: expiredBatches, error: batchesError } = await supabaseAdmin
      .from('product_batches')
      .select(`
        id,
        batch_number,
        quantity,
        expiration_date,
        inventory:inventory_id (
          id,
          branch_id,
          product_id,
          products:product_id (
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .lt('expiration_date', new Date().toISOString())

    if (batchesError) {
      console.error('Failed to load expired batches:', batchesError)
      return NextResponse.json({ error: 'Failed to load expired batches' }, { status: 500 })
    }

    const batches = (expiredBatches || []) as unknown as ExpiredBatchRow[]
    if (batches.length === 0) {
      return NextResponse.json({
        success: true,
        created: 0,
        skipped: 0,
        totalExpiredBatches: 0
      })
    }

    const batchIds = batches.map((batch) => batch.id)
    const { data: existingNotifications, error: existingError } = await supabaseAdmin
      .from('notifications')
      .select('related_entity_id')
      .eq('type', 'expiration')
      .eq('related_entity_type', 'batch')
      .in('related_entity_id', batchIds)

    if (existingError) {
      console.error('Failed to load existing expired notifications:', existingError)
      return NextResponse.json({ error: 'Failed to check existing notifications' }, { status: 500 })
    }

    const existingBatchIds = new Set(
      (existingNotifications || [])
        .map((notification) => notification.related_entity_id)
        .filter((id): id is string => typeof id === 'string')
    )

    const notificationsToInsert = batches
      .filter((batch) => batch.inventory?.branch_id && batch.inventory?.products?.name)
      .filter((batch) => !existingBatchIds.has(batch.id))
      .map((batch) => {
        const expirationDate = new Date(batch.expiration_date)
        const now = new Date()
        const daysExpired = Math.max(
          1,
          Math.ceil((now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24))
        )

        return {
          type: 'expiration',
          severity: 'critical',
          title: 'Product Expired',
          message: `Batch ${batch.batch_number} of ${batch.inventory!.products!.name} expired ${daysExpired} day(s) ago (${batch.quantity} units)`,
          branch_id: batch.inventory!.branch_id,
          related_entity_type: 'batch',
          related_entity_id: batch.id,
          metadata: {
            alert_type: 'expired',
            batch_number: batch.batch_number,
            expiration_date: batch.expiration_date,
            days_until_expiry: -daysExpired,
            days_expired: daysExpired,
            quantity: batch.quantity,
            product_name: batch.inventory!.products!.name,
            product_id: batch.inventory!.product_id,
            triggered_by: 'expired_products_sync',
            auto_generated: true
          },
          action_url: '/admin/inventory?expirationFilter=expired',
          is_read: false,
          admin_is_read: false,
          is_acknowledged: false,
          is_resolved: false
        }
      })

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsToInsert)

      if (insertError) {
        console.error('Failed to insert expired notifications:', insertError)
        return NextResponse.json({ error: 'Failed to create expired notifications' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      created: notificationsToInsert.length,
      skipped: batches.length - notificationsToInsert.length,
      totalExpiredBatches: batches.length
    })
  } catch (error) {
    console.error('Expired products notification sync failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
