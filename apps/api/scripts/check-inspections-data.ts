/**
 * Script to verify inspection and order data in the database
 * Run with: npx tsx scripts/check-inspections-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const businessId = process.env.SUPABASE_BUSINESS_ID!;

if (!supabaseUrl || !supabaseKey || !businessId) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('=== Checking Inspections Data ===\n');
  const { data: business, error: businessError } = await supabase
    .from('tenants')
    .select('id')
    .eq('business_id', businessId.toUpperCase())
    .maybeSingle();

  if (businessError || !business) {
    console.error('Business not found for SUPABASE_BUSINESS_ID');
    process.exit(1);
  }

  const tenantId = business.id;

  // 1. Get a sample inspection
  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(3);

  if (inspError) {
    console.error('Error fetching inspections:', inspError);
    return;
  }

  console.log(`Found ${inspections?.length || 0} inspections`);
  console.log('Sample inspection:', JSON.stringify(inspections?.[0], null, 2));
  console.log('\n');

  if (!inspections?.[0]?.order_id) {
    console.log('⚠️  No order_id found on inspection');
    return;
  }

  const orderId = inspections[0].order_id;
  console.log(`Checking order with ID: ${orderId}\n`);

  // 2. Get the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error('Error fetching order:', orderError);
    return;
  }

  console.log('Order data:', JSON.stringify(order, null, 2));
  console.log('\n');

  // 3. Check foreign key values
  console.log('Foreign key values:');
  console.log(`  property_id: ${order.property_id || 'NULL'}`);
  console.log(`  client_id: ${order.client_id || 'NULL'}`);
  console.log(`  inspector_id: ${order.inspector_id || 'NULL'}`);
  console.log('\n');

  // 4. Check if related records exist
  if (order.property_id) {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', order.property_id)
      .single();

    console.log('Property exists:', !!property);
    if (property) {
      console.log('Property address:', property.address_line1, property.city, property.state);
    }
    if (error) console.error('Property error:', error);
  }

  if (order.client_id) {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', order.client_id)
      .single();

    console.log('Client exists:', !!client);
    if (client) {
      console.log('Client name:', client.name);
    }
    if (error) console.error('Client error:', error);
  }

  if (order.inspector_id) {
    const { data: inspector, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.inspector_id)
      .single();

    console.log('Inspector exists:', !!inspector);
    if (inspector) {
      console.log('Inspector name:', inspector.full_name);
    }
    if (error) console.error('Inspector error:', error);
  }

  console.log('\n=== Testing Supabase Join Query ===\n');

  // 5. Test the actual join query we're using in the API
  const { data: joinedOrders, error: joinError } = await supabase
    .from('orders')
    .select(`
      id,
      property_id,
      client_id,
      inspector_id,
      properties!property_id(
        id,
        address_line1,
        city,
        state
      ),
      clients!client_id(
        id,
        name
      ),
      profiles!inspector_id(
        id,
        full_name
      )
    `)
    .eq('id', orderId);

  if (joinError) {
    console.error('Join query error:', joinError);
  } else {
    console.log('Join query result:', JSON.stringify(joinedOrders, null, 2));
  }
}

checkData()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script error:', err);
    process.exit(1);
  });
