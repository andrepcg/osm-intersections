const openrouteservice = require("openrouteservice-js");
const queryOverpass = require('@derhuerst/query-overpass')


const ORS_API_KEY = process.env.REACT_APP_ORS_KEY;
var Isochrones = new openrouteservice.Isochrones({
  api_key: ORS_API_KEY
});



export function findDuplicates(arr) {
	return arr.reduce(function(acc, el, i, arr) {
	  if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el); return acc;
	}, []);
}

export function getIsochronePoly(latlon, time_seconds) {
  return Isochrones.calculate({
    locations: [[latlon[1],latlon[0]]],
    profile: 'foot-walking',
    range: [time_seconds],
    range_type: 'time',
  })
  .then(function(response) {
    //console.log(response.features[0].geometry)
    return response.features[0].geometry.coordinates[0].map(i => [i[1], i[0]]);
  })
  .catch(function(err) {
    var str = "An error occured: " + err;
    console.log(str);
  });
}

export function uniqueCount(arr) {
  return new Set(arr).size;
}

export function getWaysLatLon(latlon, radius) {
  const q = `
    [out:json][timeout:25];
    (
      way["highway"](around: ${radius}, ${latlon.join(', ')});
    );
    (._;>;);
    out body;
  `;
  return queryOverpass(q)
  .then(function(res) {
    return res;
  })
  .catch(console.error)
}

export function getWaysPoly(polygon) {
  return queryOverpass(`
    [out:json][timeout:25];
    (
      way["highway"](poly: "${polygon}");
    );
    (._;>;);
    out body;
  `)
  .then(function(res) {
    return res;
  })
  .catch(console.error)
}
