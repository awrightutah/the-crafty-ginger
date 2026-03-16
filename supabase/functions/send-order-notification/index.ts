import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('CRAFTY_GINGER_RESEND_KEY')!

interface OrderRecord {
  id: string
  total: number
  status: string
  notes: string | null
  venmo_username: string | null
  order_type: string | null
  payment_method: string | null
  payment_status: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: OrderRecord
  schema: 'public'
  old_record: null | OrderRecord
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    
    // Only send notification for new orders (INSERT)
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not a new order, skipping' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const order = payload.record
    
    // Skip notifications for in-person orders created by admin
    // (since admin is creating them, they already know about it)
    if (order.order_type === 'in_person' || order.order_type === 'phone') {
      return new Response(JSON.stringify({ message: 'In-person order, skipping notification' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const orderIdShort = order.id.slice(0, 8)
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Build email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FFF8F0;">
        <div style="background-color: #C46B4D; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🛒 New Order Received!</h1>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px; border: 2px solid #E8DDD4;">
          <h2 style="color: #C46B4D; margin-top: 0;">Order #${orderIdShort}</h2>
          <p style="color: #666;">${orderDate}</p>
          
          <div style="background-color: #FFF8F0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #C46B4D; margin-top: 0;">Customer Information</h3>
            ${order.customer_name ? `<p><strong>Name:</strong> ${order.customer_name}</p>` : ''}
            ${order.customer_email ? `<p><strong>Email:</strong> ${order.customer_email}</p>` : ''}
            ${order.customer_phone ? `<p><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
            ${order.venmo_username ? `<p><strong>Venmo:</strong> ${order.venmo_username}</p>` : ''}
          </div>
          
          <div style="background-color: #FFF8F0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #C46B4D; margin-top: 0;">Order Details</h3>
            <p style="font-size: 24px; font-weight: bold; color: #C46B4D;">Total: $${order.total?.toFixed(2) || '0.00'}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method || 'Venmo'}</p>
            <p><strong>Payment Status:</strong> ${order.payment_status || 'Pending'}</p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://shop.thecraftyginger.com/admin/orders" 
               style="background-color: #C46B4D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Order in Dashboard
            </a>
          </div>
        </div>
        
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          The Crafty Ginger - Handmade Resin Creations
        </p>
      </div>
    `

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'The Crafty Ginger <onboarding@resend.dev>',
        to: ['juliewright0209@gmail.com'],
        subject: `🛒 New Order #${orderIdShort} - $${order.total?.toFixed(2) || '0.00'}`,
        html: emailHtml
      })
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await res.json()
    console.log('Email sent successfully:', result)
    
    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})