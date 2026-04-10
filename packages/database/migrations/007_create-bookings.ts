import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("booking_status", [
    "LOCKED_PENDING_PAYMENT",
    "CONFIRMED",
    "CANCELLED",
    "EXPIRED",
  ]);

  pgm.createTable("bookings", {
    booking_id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(user_id)",
      onDelete: "CASCADE",
    },
    show_id: {
      type: "uuid",
      notNull: true,
      references: "showtimes(show_id)",
      onDelete: "CASCADE",
    },
    status: {
      type: "booking_status",
      notNull: true,
      default: "LOCKED_PENDING_PAYMENT",
    },
    total_price: {
      type: "decimal(10,2)",
      notNull: true,
      default: 0,
    },
    expiry_timestamp: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("bookings", "user_id");
  pgm.createIndex("bookings", "show_id");
  pgm.createIndex("bookings", "expiry_timestamp", {
    where: "status = 'LOCKED_PENDING_PAYMENT'",
    name: "idx_bookings_pending_expiry",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("bookings");
  pgm.dropType("booking_status");
}
