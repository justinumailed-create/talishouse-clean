/**
 * PMC Media Directory (Ralf's PMC PDF, pages 7–11, transcribed).
 * PINs from Talispros Mapsites are auto-syndicated to these publications:
 * 10-day cycles, 7 days on and 3 days off to keep listings fresh.
 * `iso` = ISO 3166-1 alpha-2 for the flag; null = Global. `url` is internal
 * reference only (null = none listed in the source workbook) and is never
 * rendered: the public page receives `pmcMediaRows()`.
 */
export type PmcMediaOutlet = {
  outlet: string;
  location: string;
  iso: string | null;
  url: string | null;
};

const r = (outlet: string, location: string, iso: string | null, url: string | null): PmcMediaOutlet => ({
  outlet,
  location,
  iso,
  url,
});

export const PMC_MEDIA_DIRECTORY: PmcMediaOutlet[] = [
  r("Fang.com", "China", "CN", "https://www.fang.com"),
  r("99acres.com", "India", "IN", "https://www.99acres.com"),
  r("Acheter-Louer.fr", "France", "FR", "https://www.acheter-louer.fr"),
  r("Anjuke", "China", "CN", "https://www.anjuke.com"),
  r("Arkadia", "Global", null, "https://www.arkadia.com"),
  r("City24.ee", "Estonia", "EE", "https://www.city24.ee"),
  r("City24.lv", "Latvia", "LV", "https://www.city24.lv"),
  r("Côté Littoral", "France", "FR", "https://www.cotelittoral.fr"),
  r("Dar Property", "Tanzania", "TZ", "https://www.darproperty.com"),
  r("Domy.pl", "Poland", "PL", "https://www.domy.pl"),
  r("DotProperty", "Cambodia", "KH", "https://www.dotproperty-kh.com"),
  r("DotProperty", "Indonesia", "ID", "https://www.dotproperty.id"),
  r("DotProperty", "Laos", "LA", "https://www.dotproperty.la"),
  r("DotProperty", "Malaysia", "MY", "https://www.dotproperty.com.my"),
  r("DotProperty", "Myanmar", "MM", "https://www.dotproperty.com.mm"),
  r("DotProperty", "Philippines", "PH", "https://www.dotproperty.com.ph"),
  r("DotProperty", "Singapore", "SG", "https://www.dotproperty.com.sg"),
  r("DotProperty", "Thailand", "TH", "https://www.dotproperty.co.th"),
  r("DotProperty", "Vietnam", "VN", "https://www.dotproperty.com.vn"),
  r("East-West Property", "China", "CN", null),
  r("Edenway", "Global", null, null),
  r("Emlaktown", "Turkey", "TR", "https://www.emlaktown.com"),
  r("Figaro Immo", "France", "FR", "https://immobilier.lefigaro.fr"),
  r("Globaliza.com", "Spain", "ES", "https://www.globaliza.com"),
  r("Go853.com", "Macau", "MO", "https://www.go853.com"),
  r("GoPlaceIt", "Argentina", "AR", "https://www.goplaceit.com"),
  r("GoPlaceIt", "Chile", "CL", "https://www.goplaceit.com"),
  r("GoPlaceIt", "Colombia", "CO", "https://www.goplaceit.com"),
  r("GoPlaceIt", "Mexico", "MX", "https://www.goplaceit.com"),
  r("GoPlaceIt", "Peru", "PE", "https://www.goplaceit.com"),
  r("GoPlaceIt", "Uruguay", "UY", "https://www.goplaceit.com"),
  r("GoPlaceIt", "Venezuela", "VE", "https://www.goplaceit.com"),
  r("Hausples.com.pg", "Papua New Guinea", "PG", "https://www.hausples.com.pg"),
  r("Hebdo Immobilier", "Algeria", "DZ", null),
  r("HomeGlobally", "Global", null, "https://www.homeglobally.com"),
  r("Homsters.kz", "Kazakhstan", "KZ", "https://homsters.kz"),
  r("HousingParadise.com", "Fiji", "FJ", "https://www.housingparadise.com"),
  r("iCasas.cl", "Chile", "CL", "https://www.icasas.cl"),
  r("iCasas.com.co", "Colombia", "CO", "https://www.icasas.com.co"),
  r("iCasas.mx", "Mexico", "MX", "https://www.icasas.mx"),
  r("Immobiliare.it", "Italy", "IT", "https://www.immobiliare.it"),
  r("ImmoNC", "New Caledonia", "NC", null),
  r("ImmoPF", "French Polynesia", "PF", null),
  r("Immostreet.ch", "Switzerland", "CH", "https://www.immostreet.ch"),
  r("Immostreet.com", "France", "FR", "https://www.immostreet.com"),
  r("ImmoVlan", "Belgium", "BE", "https://immo.vlan.be"),
  r("Imot.bg", "Bulgaria", "BG", "https://www.imot.bg"),
  r("Imovina.net", "Serbia", "RS", "https://www.imovina.net"),
  r("Kamicasa.pt", "Portugal", "PT", "https://www.kamicasa.pt"),
  r("Kamicasa.com", "Spain", "ES", "https://www.kamicasa.com"),
  r("Kangalou", "Canada", "CA", "https://www.kangalou.com"),
  r("La Provence", "France", "FR", "https://www.laprovence.com"),
  r("Loop Imóveis", "Brazil", "BR", "https://www.loopimoveis.com.br"),
  r("Mesto.ua", "Ukraine", "UA", "https://www.mesto.ua"),
  r("Montecarlo-Realestate.com", "Monaco", "MC", "https://www.montecarlo-realestate.com"),
  r("Morizon", "Poland", "PL", "https://www.morizon.pl"),
  r("Mubawab", "Morocco", "MA", "https://www.mubawab.ma"),
  r("Mubawab Qatar", "Qatar", "QA", "https://www.mubawab.qa"),
  r("MyProperty.ph", "Philippines", "PH", "https://www.myproperty.ph"),
  r("Oferty.net", "Poland", "PL", "https://www.oferty.net"),
  r("PerSquare.co.za", "South Africa", "ZA", "https://www.persquare.co.za"),
  r("Portia", "Switzerland", "CH", null),
  r("Properstar.com", "United States", "US", "https://www.properstar.com"),
  r("Properstar AE", "United Arab Emirates", "AE", "https://www.properstar.ae"),
  r("Properstar CA", "Canada", "CA", "https://www.properstar.com/ca"),
  r("Properstar DE", "Germany", "DE", "https://www.properstar.com/de"),
  r("Properstar DK", "Denmark", "DK", "https://www.properstar.com/dk"),
  r("Properstar FR", "France", "FR", "https://www.properstar.com/fr"),
  r("Properstar IT", "Italy", "IT", "https://www.properstar.com/it"),
  r("Properstar JP", "Japan", "JP", "https://www.properstar.com/jp"),
  r("Properstar NL", "Netherlands", "NL", "https://www.properstar.com/nl"),
  r("Properstar QA", "Qatar", "QA", "https://www.properstar.com/qa"),
  r("Properstar SE", "Sweden", "SE", "https://www.properstar.com/se"),
  r("Properstar UK", "United Kingdom", "GB", "https://www.properstar.com/uk"),
  r("PropertySteps.ie", "Ireland", "IE", "https://www.propertysteps.ie"),
  r("Publimaison.ca", "Canada", "CA", "https://www.publimaison.ca"),
  r("RealCity.cz", "Czech Republic", "CZ", "https://www.realcity.cz"),
  r("Realestate.com.kh", "Cambodia", "KH", "https://www.realestate.com.kh"),
  r("Reality.sk", "Slovakia", "SK", "https://www.reality.sk"),
  r("SenegalCity.com", "Senegal", "SN", "https://www.senegalcity.com"),
  r("Selektimmo", "Morocco", "MA", null),
  r("SeLoger.com", "France", "FR", "https://www.seloger.com"),
  r("ShweProperty.com", "Myanmar", "MM", "https://www.shweproperty.com"),
  r("Sodichan", "China", "CN", null),
  r("Sokna.tn", "Tunisia", "TN", "https://www.sokna.tn"),
  r("Storia", "Romania", "RO", "https://www.storia.ro"),
  r("Spitogatos", "Greece", "GR", "https://www.spitogatos.gr"),
  r("SurfacePrivée.com", "France", "FR", "https://www.surfaceprivee.com"),
  r("Thailand-Property.com", "Thailand", "TH", "https://www.thailand-property.com"),
  r("The House Shop", "United Kingdom", "GB", "https://www.thehouseshop.com"),
  r("Tospitimou.gr", "Greece", "GR", "https://www.tospitimou.gr"),
  r("Trovit", "Global", null, "https://www.trovit.com"),
  r("Var-Matin", "France", "FR", "https://www.varmatin.com"),
  r("Willhaben.at", "Austria", "AT", "https://www.willhaben.at"),
  r("World Panama Real Estate", "Panama", "PA", null),
  r("Wortimmo", "Luxembourg", "LU", "https://www.wortimmo.lu"),
  r("XE", "Greece", "GR", null),
  r("Zezoom", "Global", null, null),
];

/** Regional-indicator flag emoji for an ISO code; 🌐 for Global. */
export function flagEmoji(iso: string | null): string {
  if (!iso || iso.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...iso.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** What the public Media Directory renders: outlet URLs never leave the server. */
export type PmcMediaRow = { outlet: string; location: string; flag: string };

export function pmcMediaRows(list: PmcMediaOutlet[] = PMC_MEDIA_DIRECTORY): PmcMediaRow[] {
  return list.map((m) => ({ outlet: m.outlet, location: m.location, flag: flagEmoji(m.iso) }));
}
