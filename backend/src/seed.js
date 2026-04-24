import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const users = [
  { name: 'Soubhik', username: 'soubhik', password: 'soubhik@o2h', role: 'admin' },
  { name: 'Bhargav', username: 'bhargav', password: 'bhargav@o2h', role: 'qa_lead' },
  { name: 'Abhinav', username: 'abhinav', password: 'abhinav@o2h', role: 'qa_engineer' },
  { name: 'Darshan', username: 'darshan', password: 'darshan@o2h', role: 'qa_engineer' },
  { name: 'Ashok',   username: 'ashok',   password: 'ashok@o2h',   role: 'qa_engineer' },
];

async function seed() {
  console.log('🌱 Seeding QA team...\n');
  for (const u of users) {
    const password_hash = await bcrypt.hash(u.password, 10);
    const { error } = await supabase.from('users')
      .upsert({ name: u.name, username: u.username, password_hash, role: u.role }, { onConflict: 'username' });
    if (error) console.error(`  ❌ ${u.name}: ${error.message}`);
    else console.log(`  ✅ ${u.name} (${u.role})  →  login: ${u.username} / ${u.password}`);
  }
  console.log('\n🎉 Done! All users created.');
  process.exit(0);
}

seed();
