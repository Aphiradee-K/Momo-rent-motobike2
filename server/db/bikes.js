// Seed catalogue based on the original project-rent-motobike repository
module.exports = [
  {
    name: "Honda Wave 110i", type: "family", price: 250, img: "img/wave.jpg",
    specs: ["110cc", "เกียร์", "ประหยัดน้ำมัน"],
    detail: { cc: "110cc", fuel: "แก๊สโซฮอล์ 91/95, E20", mpg: "59.9 กม./ลิตร", topSpeed: "95-100 กม./ชม.", seat: "758 มม.", weight: "98 กก.", starter: "มอเตอร์ไฟ + ไขกุญแจ", brake: "ดิสก์หน้า / ดรัมหลัง", color: "แดง", feature: ["ขี่ง่าย ประหยัดน้ำมันที่สุด ถึกทน ไม่จุกจิก เหมาะกับคนที่อยากได้รถขี่ใช้งานทั่วไป เน้นประหยัดค่าน้ำมัน"] }
  },
  {
    name: "Yamaha Finn 115", type: "family", price: 250, img: "img/finn.png",
    specs: ["115cc", "เกียร์", "ประหยัดน้ำมัน"],
    detail: { cc: "115cc", fuel: "แก๊สโซฮอล์ 91/95, E20, E85", mpg: "60-65 กม./ลิตร", topSpeed: "95-100 กม./ชม.", seat: "775 มม.", weight: "97 กก.", starter: "มอเตอร์ไฟฟ้า + ไขกุญแจ", brake: "ดิสก์หน้า / ดรัมหลัง", color: "ดำ", feature: ["ขี่นุ่ม ขี่ง่าย มีช่องใส่ของด้านหน้า ขี่ไกลๆ ทนทานและประหยัดน้ำมันพอๆ กับ Wave"] }
  },
  {
    name: "Honda Scoopy-i", type: "scooter", price: 300, img: "img/scoopy.jfif",
    specs: ["110cc", "อัตโนมัติ", "น้ำหนักเบา"],
    detail: { cc: "110cc", fuel: "แก๊สโซฮอล์ 91/95, E20", mpg: "55 กม./ลิตร", topSpeed: "90-95 กม./ชม.", seat: "746 มม.", weight: "95 กก.", starter: "มอเตอร์ไฟฟ้า + ไขกุญแจ", brake: "ดิสก์หน้า / ดรัมหลัง", color: "ขาว", feature: ["สกู๊ตเตอร์น่ารัก คล่องตัวสูง ขี่ในเมืองแทรกจราจรง่าย เหมาะกับคนชอบรถเบาๆ ขี่สบายๆ"] }
  },
  {
    name: "Honda Click 160", type: "scooter", price: 350, img: "img/click.jpg",
    specs: ["160cc", "อัตโนมัติ", "คล่องตัว"],
    detail: { cc: "160cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "46.9 กม./ลิตร", topSpeed: "115-120 กม./ชม.", seat: "778 มม.", weight: "116 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้าABS / ดรัมหลัง", color: "ดำ", feature: ["รถออโตเมติกสายแรง อัตราเร่งดี ทันใจ ซ้อนสองขึ้นเนินสบาย ขี่ในเมืองคล่องตัว"] }
  },
  {
    name: "Yamaha Grand Filano Hybrid", type: "scooter", price: 350, img: "img/filano.jpeg",
    specs: ["125cc", "ขับนุ่มนวล", "ใต้เบาะกว้าง"],
    detail: { cc: "125cc", fuel: "แก๊สโซฮอล์ 91,95, E20, E85", mpg: "55-60 กม./ลิตร", topSpeed: "95-100 กม./ชม.", seat: "790 มม.", weight: "101 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้าABS / ดรัมหลัง", color: "เขียว", feature: ["ขี่นุ่มนวล ใต้เบาะกว้างมากใส่กระเป๋าหรือของฝากได้เยอะ เติมน้ำมันสะดวกไม่ต้องเปิดเบาะ"] }
  },
  {
    name: "Honda PCX 160", type: "premium", price: 450, img: "img/pcx160.jpg",
    specs: ["160cc", "เบาะนุ่มนั่งสบาย", "Touring"],
    detail: { cc: "160cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "45 กม./ลิตร", topSpeed: "118-123 กม./ชม.", seat: "764 มม.", weight: "131 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง", color: "น้ำเงิน", feature: ["พรีเมียมสกู๊ตเตอร์ นั่งสบายทั้งคนขับคนซ้อน ขี่ข้ามจังหวัดหรือเดินทางไกลไม่เหนื่อย ใต้เบาะกว้าง"] }
  },
  {
    name: "Yamaha XMAX 300", type: "premium", price: 500, img: "img/xmax300.jpg",
    specs: ["300cc", "เครื่องแรง", "นั่งสบาย"],
    detail: { cc: "300cc", fuel: "แก๊สโซฮอล์ 91,95, E10", mpg: "31 กม./ลิตร", topSpeed: "140-145 กม./ชม.", seat: "795 มม.", weight: "179 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลังABS", color: "เทา", feature: ["บิ๊กสกู๊ตเตอร์สายลุยทางไกล เครื่องแรง เร่งแซงเด็ดขาด เบาะใหญ่เต็มก้น นั่งสบายสุดๆ"] }
  },
  {
    name: "Vespa Sprint", type: "premium", price: 600, img: "img/vespa.png",
    specs: ["155cc", "รถคลาสสิก", "ขับชิลๆ"],
    detail: { cc: "155cc", fuel: "แก๊สโซฮอล์ 95", mpg: "38 กม./ลิตร", topSpeed: "105-110 กม./ชม.", seat: "790 มม.", weight: "120 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้าABS / ดรัมหลัง", color: "เหลือง", feature: ["รถทรงคลาสสิกสุดเท่ ถ่ายรูปสวยทุกมุม ได้ฟีลไลฟ์สไตล์ขับชิลๆ ในเมือง"] }
  },
  {
    name: "Yamaha MT-15", type: "sport", price: 750, img: "img/mt15.jpg",
    specs: ["155cc", "สายลุย", "เข้าโค้งสนุก"],
    detail: { cc: "155cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "40-45 กม./ลิตร", topSpeed: "250+ กม./ชม.", seat: "810 มม.", weight: "133 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง", color: "น้ำเงิน", feature: ["รถเกียร์ทรงเนกเกตไบค์สายสปอร์ต ดีไซน์เท่ ทรงตัวดี เข้าโค้งสนุก เหมาะกับสายขับขี่ลุยๆ"] }
  },
  {
    name: "Honda CRB300R", type: "sport", price: 800, img: "img/crb300r.jpg",
    specs: ["300cc", "ทรงสปอรต์", "ขี่ทางไกล"],
    detail: { cc: "300cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "30 กม./ลิตร", topSpeed: "150-155 กม./ชม.", seat: "785 มม.", weight: "163 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง Dual ABS", color: "ดำ", feature: ["รถทรงสปอร์ตมีแฟริ่ง ได้ฟีลเท่แบบรถแข่ง ขี่ทางไกลกำลังเครื่องยนต์เหลือๆ"] }
  },
  {
    name: "Kawasaki Z400", type: "sport", price: 1000, img: "img/z400.jpg",
    specs: ["400cc", "เกียร์", "ขี่ทางไกล"],
    detail: { cc: "399cc", fuel: "แก๊สโซฮอล์ 95", mpg: "24 กม./ลิตร", topSpeed: "165-170 กม./ชม.", seat: "785 มม.", weight: "167 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง ABS", color: "เขียว", feature: ["รถเกียร์ 2 สูบเสียงแน่น เครื่องยนต์แรงสะใจ เหมาะกับคนที่อยากได้ความมันส์ในการขับขี่ทางไกล"] }
  },
  {
    name: "Yamaha XSR155", type: "classic", price: 850, img: "img/XSR-155.jpg",
    specs: ["155cc", "ทันสมัย", "ขึ้นเขาลงห้วยสบาย"],
    detail: { cc: "155cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "40-45 กม./ลิตร", topSpeed: "130 กม./ชม.", seat: "810 มม.", weight: "134 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง", color: "ดำ", feature: ["ทรงวินเทจเรโทรผสมความทันสมัย ได้ความเท่ไม่เหมือนใคร ขี่เที่ยวคาเฟ่หรือขึ้นเขาลงห้วยกำลังดี"] }
  },
  {
    name: "Royal Enfield Meteor 350", type: "classic", price: 1200, img: "img/royal.webp",
    specs: ["350cc", "ท่องเที่ยว", "นั่งเหยียดขาสบาย"],
    detail: { cc: "350cc", fuel: "แก๊สโซฮอล์ 95", mpg: "35 กม./ลิตร", topSpeed: "115-120 กม./ชม.", seat: "765 มม.", weight: "191 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง Dual ABS", color: "แดง", feature: ["รถครุยเซอร์ทรงเตี้ย ท่านั่งเหยียดขาขับสบาย ไม่เหนื่อยหลัง เหมาะกับขี่ท่องเที่ยวเสพบรรยากาศ"] }
  },
  {
    name: "Honda ADV350", type: "adventure", price: 900, img: "img/adv350.jpg",
    specs: ["330cc", "สายลุย", "ซับแรง"],
    detail: { cc: "330cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "29.4 กม./ลิตร", topSpeed: "135-140 กม./ชม.", seat: "795 มม.", weight: "186 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง Dual ABS", color: "น้ำเงิน", feature: ["รถออโตเมติกสายลุย ช่วงล่างนุ่มนวล ซับแรงกระแทกดีมาก ลุยทางขรุขระหรือทางฝุ่นได้อย่างมั่นใจ"] }
  },
  {
    name: "Kawasaki Versys650", type: "adventure", price: 1200, img: "img/versys650.jpg",
    specs: ["649cc", "เดินทางไกล", "ขี่ข้ามจังหวัด"],
    detail: { cc: "649cc", fuel: "แก๊สโซฮอล์ 95", mpg: "21 กม./ลิตร", topSpeed: "185-190 กม./ชม.", seat: "845 มม.", weight: "219 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์คู่หน้า / หลังABS", color: "เทา", feature: ["รถทัวริ่งสายเดินทางไกลตัวจริง ลุยได้ทุกสภาพถนน มีชิลด์บังลมขนาดใหญ่ ขี่ขึ้นเขาข้ามจังหวัดสบายที่สุด"] }
  },
  {
    name: "Honda Giorno+", type: "scooter", price: 900, img: "img/giorno+.jpg",
    specs: ["124.77cc", "ใต้เบาะจุของได้เยอะ", "คลาสสิก"],
    detail: { cc: "124.77cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "52.6 กม./ลิตร", topSpeed: "100-105 กม./ชม.", seat: "780 มม.", weight: "120 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์ / ดรัม", color: "เทา", feature: ["ทรงคลาสสิกสไตล์มินิมอล พื้นวางเท้าระนาบกว้าง ถังน้ำมันอยู่ด้านหน้าเติมง่าย ใต้เบาะจุของได้เยอะ"] }
  },
  {
    name: "Yamaha Fazzio", type: "scooter", price: 850, img: "img/fazzio.jfif",
    specs: ["125cc", "น้ำหนักเบา", "คล่อง"],
    detail: { cc: "125cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "55 กม./ลิตร", topSpeed: "90-95 กม./ชม.", seat: "750 มม.", weight: "96 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์ / ดรัม", color: "ชมพู", feature: ["รถวัยรุ่นทรงเก๋ ดีไซน์น่ารัก คล่องตัว น้ำหนักเบา ขี่เที่ยวในเมืองเข้าแคฟ่ถ่ายรูปสวย"] }
  },
  {
    name: "Honda Forza 350", type: "premium", price: 900, img: "img/forza350.jfif",
    specs: ["350cc", "เดินทางไกล", "นุ่มนวล"],
    detail: { cc: "329.6cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "30 กม./ลิตร", topSpeed: "140-145 กม./ชม.", seat: "780 มม.", weight: "185 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์คู่ Dual ABS", color: "ดำ", feature: ["บิ๊กสกู๊ตเตอร์หรูหรา มีชิลด์หน้าปรับไฟฟ้าบังลมได้ดีมาก ขี่เดินทางไกลนุ่มนวลและนิ่งมาก"] }
  },
  {
    name: "Yamaha YZF-R15", type: "sport", price: 1200, img: "img/rzfr15.jpg",
    specs: ["155cc", "สปอรต์", "ทรงรถแข่ง"],
    detail: { cc: "155cc", fuel: "แก๊สโซฮอล์ 91,95, E20", mpg: "45 กม./ลิตร", topSpeed: "135-140 กม./ชม.", seat: "815 มม.", weight: "137 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง ABS", color: "น้ำเงิน", feature: ["รถสปอร์ตทรงรถแข่ง Moto GP ท่าขี่หมอบสปอร์ตเรซซิ่ง เหมาะกับคนชอบความสปอร์ตเต็มขั้น"] }
  },
  {
    name: "GPX Demon GR200R", type: "sport", price: 1000, img: "img/gr200r.jpg",
    specs: ["200cc", "ลุคสปอรต์", "ขี่ง่าย"],
    detail: { cc: "200cc", fuel: "แก๊สโซฮอล์ 91,95", mpg: "35 กม./ลิตร", topSpeed: "130-135 กม./ชม.", seat: "815 มม.", weight: "155 กก.", starter: "มอเตอร์ไฟฟ้า", brake: "ดิสก์หน้า-หลัง", color: "ดำ", feature: ["รถสปอร์ตหน้าตาดีไซน์โฉบเฉี่ยว ราคาย่อมเยา ขี่ง่าย ได้ลุคสปอร์ตเท่ๆ"] }
  }
];
