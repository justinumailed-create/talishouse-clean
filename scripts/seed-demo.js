const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemo() {
  const demo = {
    name: "Demo Partner",
    fast_code: "DEMO123",
    mapsite_slug: "demo",
    hero_type: "image",
    hero_content: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    page_headline: "Welcome to our Demo Mapsite",
    page_subtext: "Explore our premium modular home solutions and property discovery tools.",
    page_contact_cta: "Refer a Project",
    show_video: true,
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder YouTube link
    is_page_enabled: true
  };

  const { data, error } = await supabase
    .from('associates')
    .upsert([demo], { onConflict: 'mapsite_slug' });

  if (error) {
    console.error("Error seeding demo:", error);
  } else {
    console.log("Demo associate seeded successfully");
  }
}

seedDemo();
