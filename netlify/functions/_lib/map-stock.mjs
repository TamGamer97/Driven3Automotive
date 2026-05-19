const BODY_MAP = {
  suv: 'suv',
  saloon: 'saloon',
  coupe: 'coupe',
  estate: 'estate',
  hatchback: 'hatchback',
  convertible: 'coupe',
  'pick-up': 'suv',
  pickup: 'suv',
  mpv: 'suv',
};

function normalizeBodyType(bodyType, fuelType) {
  if ((fuelType || '').toLowerCase() === 'electric') return 'electric';
  const key = String(bodyType || '').toLowerCase().trim();
  return BODY_MAP[key] || key || 'saloon';
}

function formatMiles(miles) {
  const n = Number(miles);
  if (!Number.isFinite(n) || n < 0) return '';
  return n.toLocaleString('en-GB');
}

function imageHrefToUrl(href) {
  if (!href || typeof href !== 'string') return '';
  return href.replace('{resize}', 'w800');
}

function mapImages(media) {
  const images = media?.images;
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => imageHrefToUrl(img?.href))
    .filter(Boolean);
}

function mapStatus(metadata, adverts) {
  const lifecycle = metadata?.lifecycleState;
  const reserved = adverts?.reservationStatus === 'Reserved';
  if (lifecycle === 'SOLD') return 'sold';
  if (lifecycle === 'SALE_IN_PROGRESS' || reserved) return 'reserved';
  if (lifecycle === 'FORECOURT' || lifecycle === 'DUE_IN') return 'active';
  return 'draft';
}

function mapPrice(adverts) {
  const retail = adverts?.retailAdverts;
  const candidates = [
    retail?.suppliedPrice?.amountGBP,
    retail?.totalPrice?.amountGBP,
    adverts?.forecourtPrice?.amountGBP,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function mapBadge(adverts, status) {
  if (status === 'reserved') return 'Reserved';
  if (status === 'sold') return 'Sold';
  const grabber = adverts?.retailAdverts?.attentionGrabber;
  return grabber ? String(grabber).trim() : '';
}

function mapFeatures(features) {
  if (!Array.isArray(features)) return [];
  return features
    .map((f) => f?.standardName || f?.name)
    .filter(Boolean);
}

function mapEngine(vehicle) {
  const cc = vehicle?.engineCapacityCC;
  const litres = vehicle?.badgeEngineSizeLitres;
  if (cc) return `${cc} cc`;
  if (litres) return `${litres}L`;
  return '';
}

function mapPower(vehicle) {
  const bhp = vehicle?.enginePowerBHP;
  if (bhp) return `${bhp} bhp`;
  return '';
}

function mapCo2(vehicle) {
  const co2 = vehicle?.co2EmissionGPKM;
  if (co2 === null || co2 === undefined) return '';
  return `${co2} g/km`;
}

function isPublicStock(item) {
  const lifecycle = item?.metadata?.lifecycleState;
  if (!['FORECOURT', 'SALE_IN_PROGRESS'].includes(lifecycle)) return false;

  const retailStatus = item?.adverts?.retailAdverts?.autotraderAdvert?.status;
  const advertiserStatus = item?.adverts?.retailAdverts?.advertiserAdvert?.status;
  if (retailStatus === 'PUBLISHED' || advertiserStatus === 'PUBLISHED') return true;

  // Sandbox / dealer site: show forecourt stock even if channel flags differ
  return lifecycle === 'FORECOURT' || lifecycle === 'SALE_IN_PROGRESS';
}

export function mapStockItem(item) {
  const vehicle = item?.vehicle || {};
  const adverts = item?.adverts || {};
  const metadata = item?.metadata || {};
  const status = mapStatus(metadata, adverts);
  const imgs = mapImages(item?.media);
  const price = mapPrice(adverts);
  const fuel = vehicle.fuelType || '';
  const body = normalizeBodyType(vehicle.bodyType, fuel);

  let description = adverts?.retailAdverts?.description || '';
  const description2 = adverts?.retailAdverts?.description2;
  if (description2) {
    description = description ? `${description}\n\n${description2}` : description2;
  }

  const milesNum = vehicle.odometerReadingMiles ?? vehicle.lastServiceOdometerReadingMiles;
  const owners = vehicle.previousOwners ?? vehicle.owners ?? item?.history?.previousOwners;

  return {
    id: metadata.stockId || metadata.searchId || '',
    make: vehicle.make || vehicle.standard?.make || '',
    model: vehicle.model || vehicle.standard?.model || '',
    variant: vehicle.derivative || vehicle.standard?.derivative || '',
    year: Number(vehicle.yearOfManufacture) || 0,
    miles: formatMiles(milesNum),
    fuel,
    trans: vehicle.transmissionType || '',
    price,
    body,
    img: imgs[0] || '',
    badge: mapBadge(adverts, status),
    color: vehicle.colour || vehicle.standard?.colour || '',
    doors: Number(vehicle.doors) || 0,
    seats: Number(vehicle.seats) || 0,
    engine: mapEngine(vehicle),
    power: mapPower(vehicle),
    torque: vehicle.engineTorqueNM ? `${vehicle.engineTorqueNM} Nm` : '',
    co2: mapCo2(vehicle),
    reg: vehicle.registration || vehicle.plate || '',
    owners: Number(owners) || 0,
    mot: vehicle.motExpiryDate ? `MOT expires ${vehicle.motExpiryDate}` : '',
    serviceHistory: vehicle.serviceHistory || '',
    description: description || '',
    features: mapFeatures(item?.features),
    imgs,
    status,
    featured: 'no',
    searchId: metadata.searchId || null,
  };
}

export function mapStockResults(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return results
    .filter(isPublicStock)
    .map(mapStockItem)
    .filter((listing) => listing.id && listing.make);
}
