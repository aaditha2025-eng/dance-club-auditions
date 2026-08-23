import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://fyuydudygbayyrcohovn.supabase.co', 'sb_publishable_Ck4WvznjWIHRj0GqzawIzA_RhTrtvXF')

async function test() {
  const { data, error } = await supabase.from('faculty_roles').select('*')
  console.log('Data:', data)
  console.log('Error:', error)
}

test()
