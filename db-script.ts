
import { db, pool } from './server/db';
import { sql } from 'drizzle-orm';

async function applySchemaChanges() {
  try {
    // Drop the existing foreign key constraint
    await db.execute(sql`
      ALTER TABLE chat_messages 
      DROP CONSTRAINT IF EXISTS chat_messages_project_id_projects_id_fk;
    `);

    // Drop NOT NULL constraint
    await db.execute(sql`
      ALTER TABLE chat_messages 
      ALTER COLUMN project_id DROP NOT NULL;
    `);

    // Add new foreign key constraint allowing nulls
    await db.execute(sql`
      ALTER TABLE chat_messages 
      ADD CONSTRAINT chat_messages_project_id_projects_id_fk 
      FOREIGN KEY (project_id) REFERENCES projects(id);
    `);
    
    console.log('Schema update successful! Column project_id in chat_messages is now nullable.');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

applySchemaChanges();
