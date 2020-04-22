import React from 'react';
import { uniqueCount, findDuplicates, getWaysLatLon, getIsochronePoly, getWaysPoly } from './utils';
import { Map, Marker, Circle, TileLayer, Polygon, Polyline } from 'react-leaflet'
import './App.css';

function getLatLon(lat, lon) {
  return [Number(lat), Number(lon)];
}

const position = [40.199031, -8.410876]

function App() {
  const mapRef = React.useRef();
  const [latlon, setLatlon] = React.useState(position);
  // const [latitude, setLatitude] = React.useState('');
  // const [longitude, setLongitude] = React.useState('');
  const [results, setResults] = React.useState('');
  const [mode, setMode] = React.useState('radius');
  const [timeDistance, setTimeDistance] = React.useState(500);
  const [poly, setPoly] = React.useState();
  const [ways, setWays] = React.useState([]);
  const [intersections, setIntersections] = React.useState([]);


  function enrichWays(ways, nodes) {
    const enrichedWays = ways.map(w => {
      const newNodes = w.nodes.map(nodeId => nodes.find(n => n.id === nodeId))
      return {
        ...w,
        latLngList: newNodes.map(n => [n.lat, n.lon])
      };
    });
    setWays(enrichedWays);
  }

  function parseResults(overpassResults) {
    const ways = overpassResults.filter(e => e.type === 'way');
    const allNodes = ways.flatMap(w => w.nodes);
    const uniqueNodesCount = uniqueCount(allNodes);
    const intersections = findDuplicates(allNodes);
    enrichWays(ways, overpassResults.filter(e => e.type === 'node'));
    setIntersections(intersections.map(nid => overpassResults.find(n => n.id === nid)));

    setResults(`ways = ${ways.length}
nodes = ${uniqueNodesCount}
intersections = ${intersections.length}
ways/nodes = ${ways.length/uniqueNodesCount}`);
  }

  const handleClick = (e) => {
    console.log(e.latlng)
    setLatlon([e.latlng.lat, e.latlng.lng])
    const map = mapRef.current
    if (map != null) {
      map.leafletElement.setView(e.latlng);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    setResults('Processing...');
    setWays([])

    if (mode === 'radius') {
      getWaysLatLon(latlon, timeDistance)
        .then(parseResults);
    } else if (mode === 'iso') {
      getIsochronePoly(latlon, timeDistance)
        .then(poly => {
          setPoly(poly);
          getWaysPoly(poly.flatMap(i => i).join(" ")).then(parseResults);
        });
    }
  }


  return (
    <div className="container-fluid">
      <div className="row justify-content-center mt-5">
        <div className="col-8">
          <Map
            style={{width: '100%',height: '600px'}}
            center={position}
            zoom={13}
            onClick={handleClick}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={latlon} />
            <Circle color="red" center={latlon} radius={timeDistance} />
            {mode === 'iso' && (
              poly && <Polygon positions={poly} />
              )}
            {ways && ways.map(w => <Polyline weight="2" color="#03f" positions={w.latLngList} />)}
            {intersections.map(node => (
              <Circle color="green" center={[node.lat, node.lon]} radius={5} />
            ))}
          </Map>
        </div>
      </div>

      <div className="row justify-content-center mt-5">
        <div className="col-4">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <input disabled className="form-control" type="text" value={latlon[0]} placeholder="latitude" />
            </div>
            <div className="form-group">
              <input disabled className="form-control" type="text" value={latlon[1]} placeholder="longitude" />
            </div>
            <div className="form-group">
              <label htmlFor="mode">Mode</label>
              <select name="mode" className="custom-select" value={mode} onChange={e => setMode(e.target.value)}>
                <option value="radius">Radius</option>
                <option value="iso">Isochrone</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="td">{mode === 'radius' ? 'Distance (meters)' : 'Time (seconds)'}</label>
              <input className="form-control" name="td" type="number" value={timeDistance} placeholder="time/distance" onChange={e => setTimeDistance(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Calculate</button>
          </form>

          <textarea readOnly className="form-control mt-4" rows="8" value={results} />
        </div>
      </div>
    </div>
  );
}

export default App;
