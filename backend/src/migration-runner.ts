import * as mariadb from "mariadb";
import * as fs from "fs";
import * as path from "path";

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

class MigrationRunner {
  private pool: any;
  private migrationsPath: string;

  constructor(pool: any) {
    this.pool = pool;
    this.migrationsPath = path.join(__dirname, "../backend/migrations");
  }

  async initializeMigrationsTable(): Promise<void> {
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
    `;
    
    await this.pool.query(createMigrationsTable);
  }

  private async getAppliedMigrations(): Promise<Set<string>> {
    const rows = await this.pool.query("SELECT id FROM migrations");
    return new Set(rows.map((row: any) => row.id));
  }

  private getMigrationFiles(): Migration[] {
    const files = fs.readdirSync(this.migrationsPath)
      .filter((file: string) => file.endsWith('.sql'))
      .sort();
    
    return files.map((filename: string) => {
      const id = filename.replace('.sql', '');
      const sql = fs.readFileSync(path.join(this.migrationsPath, filename), 'utf8');
      return { id, filename, sql };
    });
  }

  async runMigrations(): Promise<void> {
    console.log("Starting database migrations...");
    
    await this.initializeMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(migration => !appliedMigrations.has(migration.id));
    
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");
      return;
    }
    
    console.log(`Applying ${pendingMigrations.length} migrations...`);
    
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const migration of pendingMigrations) {
        console.log(`Applying migration: ${migration.filename}`);
        
        await connection.query(migration.sql);
        await connection.query(
          "INSERT INTO migrations (id, filename) VALUES (?, ?)",
          [migration.id, migration.filename]
        );
        
        console.log(`Applied migration: ${migration.filename}`);
      }
      
      await connection.commit();
      console.log("All migrations applied successfully!");
    } catch (error) {
      await connection.rollback();
      console.error("Migration failed:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default MigrationRunner;
