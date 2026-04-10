import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("showtimes", {
    show_id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    movie_id: {
      type: "uuid",
      notNull: true,
      references: "movies(movie_id)",
      onDelete: "CASCADE",
    },
    audit_id: {
      type: "uuid",
      notNull: true,
      references: "auditoriums(audit_id)",
      onDelete: "CASCADE",
    },
    start_time: { type: "time", notNull: true },
    date: { type: "date", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("showtimes", "uq_auditorium_time", {
    unique: ["audit_id", "date", "start_time"],
  });
  pgm.createIndex("showtimes", "movie_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("showtimes");
}
