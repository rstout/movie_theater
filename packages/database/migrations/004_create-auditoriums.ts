import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("auditoriums", {
    audit_id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(255)", notNull: true },
    theater_id: {
      type: "uuid",
      notNull: true,
      references: "theaters(theater_id)",
      onDelete: "CASCADE",
    },
    seat_count: { type: "integer", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("auditoriums", "theater_id");
  pgm.addConstraint("auditoriums", "uq_auditorium_in_theater", {
    unique: ["name", "theater_id"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("auditoriums");
}
