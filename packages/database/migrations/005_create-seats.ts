import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("seat_type", ["STANDARD", "PREMIUM", "VIP"]);

  pgm.createTable("seats", {
    seat_id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    audit_id: {
      type: "uuid",
      notNull: true,
      references: "auditoriums(audit_id)",
      onDelete: "CASCADE",
    },
    row_label: { type: "varchar(5)", notNull: true },
    seat_number: { type: "integer", notNull: true },
    type: { type: "seat_type", notNull: true, default: "STANDARD" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("seats", "audit_id");
  pgm.addConstraint("seats", "uq_seat_in_auditorium", {
    unique: ["audit_id", "row_label", "seat_number"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("seats");
  pgm.dropType("seat_type");
}
