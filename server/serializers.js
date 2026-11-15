function bikeOut(row, extra = {}) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    price: row.price,
    img: row.img,
    specs: safeJSON(row.specs, []),
    detail: {
      cc: row.cc,
      fuel: row.fuel,
      mpg: row.mpg,
      topSpeed: row.top_speed,
      seat: row.seat,
      weight: row.weight,
      starter: row.starter,
      brake: row.brake,
      color: row.color,
      feature: safeJSON(row.features, []),
    },
    ...extra,
  };
}

function bookingOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    bid: row.id,
    bikeId: row.bike_id,
    name: row.bike_name,
    img: row.bike_img,
    renterId: row.user_id,
    renter: row.renter_name,
    phone: row.phone,
    start: row.start_date,
    end: row.end_date,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    renterProfile: {
      firstName: row.first_name || "",
      lastName: row.last_name || "",
      email: row.renter_email || "",
      address: row.renter_address || "",
      phone: row.phone || "",
      idCardImg: row.renter_id_card || null,
    },
  };
}

const BOOKING_SELECT = `
  SELECT b.*, bk.name AS bike_name, bk.img AS bike_img, bk.price AS bike_price,
         u.first_name, u.last_name, u.email AS renter_email,
         u.address AS renter_address, u.id_card_img AS renter_id_card
  FROM bookings b
  JOIN bikes bk ON bk.id = b.bike_id
  JOIN users u ON u.id = b.user_id
`;

function safeJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

module.exports = { bikeOut, bookingOut, BOOKING_SELECT, safeJSON };
