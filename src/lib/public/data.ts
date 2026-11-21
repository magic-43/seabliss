import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { PublicRoomDetails, PublicSettings } from './content'

// Share these public reads between the layout and page in a single render.
// Use the existing RLS-aware client, never the administrative service client.
export const getPublicResortData = cache(async (): Promise<{ rooms: PublicRoomDetails[] | null; settings: PublicSettings | null }> => {
  try {
    const supabase = await createClient()
    const [rooms, settings] = await Promise.all([
      supabase.from('rooms').select('id,slug,name,category,tagline,description,size_sqm,bed_type,location,regular_rate,min_guests,max_guests,amenities,features,gallery,has_plunge_pool').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('resort_settings').select('address,contact_email,contact_phone,contact_facebook_url,contact_instagram_url,check_in_time,check_out_time,extra_person_fee,security_deposit').eq('id', 1).maybeSingle(),
    ])
    if (rooms.error) console.error('Could not load public accommodations', rooms.error.code)
    if (settings.error) console.error('Could not load public resort information', settings.error.code)
    return { rooms: rooms.error ? null : rooms.data, settings: settings.error ? null : settings.data }
  } catch {
    console.error('Public resort information is temporarily unavailable')
    return { rooms: null, settings: null }
  }
})
