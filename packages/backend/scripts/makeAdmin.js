import { db } from "../src/libs/db.js";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../.env', import.meta.url) });

async function makeAdmin(email) {
  try {
    const user = await db.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log(`✅ User ${email} is now an ADMIN`);
    console.log('User:', user);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

makeAdmin('armaanfaaiz.3775@gmail.com');
