import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("showtime_seat_status", ["AVAILABLE", "LOCKED", "BOOKED"]);

  pgm.createTable("showtime_seats", {
    seat_id: {
      type: "uuid",
      notNull: true,
      references: "seats(seat_id)",
      onDelete: "CASCADE",
    },
    show_id: {
      type: "uuid",
      notNull: true,
      references: "showtimes(show_id)",
      onDelete: "CASCADE",
    },
    status: {
      type: "showtime_seat_status",
      notNull: true,
      default: "AVAILABLE",
    },
    booking_id: {
      type: "uuid",
      references: "bookings(booking_id)",
      onDelete: "SET NULL",
    },
  });

  pgm.addConstraint("showtime_seats", "pk_showtime_seats", {
    primaryKey: ["seat_id", "show_id"],
  });
  pgm.createIndex("showtime_seats", "show_id");
  pgm.createIndex("showtime_seats", "booking_id", {
    where: "booking_id IS NOT NULL",
    name: "idx_showtime_seats_booking",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("showtime_seats");
  pgm.dropType("showtime_seat_status");
}
