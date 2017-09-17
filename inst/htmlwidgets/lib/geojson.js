
function drag_drop_geojson(map_id) {
    
    window[map_id + 'drop-container'] = document.createElement("div");
    window[map_id + 'drop-container'].setAttribute('id', 'drop-container');
    document.body.appendChild(window[map_id + 'drop-container']);
    
    window[map_id + 'drop-silhouette'] = document.createElement("div");
    window[map_id + 'drop-silhouette'].setAttribute('id', 'drop-silhouette');
    window[map_id + 'drop-container'].appendChild(window[map_id + 'drop-silhouette']);
    
    initEvents(map_id);
}

function loadGeoJsonString(geoString) {
    
    // TODO: don't explicitely use the 0th argument of window.params
    // - find the object by name
    var geojson = JSON.parse(geoString),
        map_id = window.params[0].map_id;
    
    window[map_id + 'map'].data.addGeoJson(geojson);
    
    // TODO: update map bounds
    zoom(map_id, window[map_id + 'map'].data);
}


/* DOM (drag/drop) functions */

function initEvents(map_id) {
    // set up the drag & drop events
    var mapContainer = document.getElementById(map_id);
    var dropContainer = document.getElementById('drop-container');

    // map-specific events
    mapContainer.addEventListener('dragenter', showPanel, false);

    // overlay specific events (since it only appears once drag starts)
    dropContainer.addEventListener('dragover', showPanel, false);
    dropContainer.addEventListener('drop', handleDrop, false);
    dropContainer.addEventListener('dragleave', hidePanel, false);
}

function showPanel(e) {
    e.stopPropagation();
    e.preventDefault();
    document.getElementById('drop-container').style.display = 'block';
    return false;
 }

function hidePanel(e) {
    document.getElementById('drop-container').style.display = 'none';
}


function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    hidePanel(e);

    var files = e.dataTransfer.files;
    if (files.length) {
      // process file(s) being dropped
      // grab the file data from each file
      for (var i = 0, file; file = files[i]; i++) {
        var reader = new FileReader();
        reader.onload = function(e) {
          loadGeoJsonString(e.target.result);
        };
        reader.onerror = function(e) {
          console.error('reading failed');
        };
        reader.readAsText(file);
      }
    } else {
      // process non-file (e.g. text or html) content being dropped
      // grab the plain text version of the data
      var plainText = e.dataTransfer.getData('text/plain');
      if (plainText) {
        loadGeoJsonString(plainText);
      }
    }

    // prevent drag event from bubbling further
    return false;
}

                                                          
function add_geojson(map_id, geojson, geojson_source, style, update_map_view, layer_id) {
    
    window[map_id + 'googleGeojson' + layer_id] = new google.maps.Data({ map: window[map_id + 'map'] });
    
    if (geojson_source === "local") {
        
        window[map_id + 'googleGeojson' + layer_id].addGeoJson(geojson);
        
    } else if (geojson_source === "url") {

        window[map_id + 'googleGeojson' + layer_id].loadGeoJson(geojson);
    }
    
    // a function that computes the style for each feature
    window[map_id + 'googleGeojson' + layer_id].setStyle(function (feature) {
        
        if (update_map_view === true) {
            zoom(map_id, window[map_id + 'googleGeojson' + layer_id])
        }
        
        return ({
            // all
            
            clickable: getAttribute(feature, style, 'clickable'),
            visible: getAttribute(feature, style, 'visible'),
            zIndex: getAttribute(feature, style, 'zIndex'),
            // point
            cursor: getAttribute(feature, style, 'cursor'),
            icon: getAttribute(feature, style, 'icon'),
            shape: getAttribute(feature, style, 'shape'),
            title: getAttribute(feature, style, 'title'),
            // lines
            strokeColor: getAttribute(feature, style, 'strokeColor'),
            strokeOpacity: getAttribute(feature, style, 'strokeOpacity'),
            strokeWeight: getAttribute(feature, style, 'strokeWeight'),
            // polygons
            fillColor: getAttribute(feature, style, 'fillColor'),
            fillOpacity: getAttribute(feature, style, 'fillOpacity'),
        });
    });
}

/**
* Update a map's viewport to fit each geometry in a dataset
* @param {google.maps.Map} map The map to adjust
*/

function zoom(map_id, mapObj) {
    
    mapObj.forEach(function(feature) {
        
        feature.getGeometry().forEachLatLng(function(latLng){
            window[map_id + 'mapBounds'].extend(latLng);
        });
    });

    window[map_id + 'map'].fitBounds(window[map_id + 'mapBounds']);
}


function zoom2(map_id, layer_id) {
    
    window[map_id + 'googleGeojson' + layer_id].forEach(function(feature) {
        
        feature.getGeometry().forEachLatLng(function(latLng){
            window[map_id + 'mapBounds'].extend(latLng);
        });
    });

    window[map_id + 'map'].fitBounds(window[map_id + 'mapBounds']);
}

function getAttribute(feature, style, attr){
    
    if (style == null){
        return feature.getProperty(attr);
    }
    
	if (style[attr] !== undefined) {   // a style has been provided
        console.log("style provided");
        
		if (feature.getProperty([style[attr]]) !== undefined) {   // the provided style doesn't exist in the feature
            console.log("styel doesn't exist in feature");
			return feature.getProperty([style[attr]]);
		} else {                      // so assume the style is a valid colour/feature
            console.log("use the style")
			return style[attr];
		}
	} else { 
        return feature.getProperty(attr);
	}
}


function clear_geojson(map_id, layer_id) {
    window[map_id + 'googleGeojson' + layer_id].setMap(null);
    window[map_id + 'googleGeojson' + layer_id] = null;
}

function update_geojson(map_id, style, layer_id) {
    
    var operators = {
        '>': function (a, b) { return a > b; },
        '>=': function (a, b) { return a >= b; },
        '<': function (a, b) { return a < b; },
        '<=': function (a, b) { return a <= b; },
        '=': function (a, b) { return a === b; }
    },
        op = (style.operator === undefined ? "=" : style.operator),
        property = style.property,
        value = style.value,
        feature = style.feature,
        styleValue = style.style,
        newFeatures = style.features;
    
        
    window[map_id + 'googleGeojson' + layer_id].setStyle(function (feature) {
        
        var featureFillColor = feature.getProperty("fillColor"),
            featureFillOpacity = feature.getProperty("fillOpacity"),
            featureStrokeColor = feature.getProperty("strokeColor"),
            featureStrokeOpacity = feature.getProperty("strokeOpacity"),
            featureStrokeWeight = feature.getProperty("strokeWeight"),
            featureCursor = feature.getProperty("cursor"),
            featureIcon = feature.getProperty("icon"),
            featureShape = feature.getProperty("shape"),
            featureTitle = feature.getProperty("title"),
            newFillColor = newFeatures.fillColor,
            newFillOpacity = newFeatures.fillOpacity,
            newStrokeColor = newFeatures.strokeColor,
            newStrokeOpacity = newFeatures.strokeOpacity,
            newStrokeWeight = newFeatures.strokeWeight,
            newCursor = newFeatures.cursor,
            newIcon = newFeatures.icon,
            newShape = newFeatures.shape,
            newTitle = newFeatures.title;
        
        if (operators[op](feature.getProperty(property), value)) {
            featureFillColor = (newFillColor === undefined ? featureFillColor : newFillColor);
            featureFillOpacity = (newFillOpacity === undefined ? featureFillOpacity : newFillOpacity);
            featureStrokeColor = (newStrokeColor === undefined ? featureStrokeColor : newStrokeColor);
            featureStrokeOpacity = (newStrokeOpacity === undefined ? featureStrokeOpacity : newStrokeOpacity);
            featureStrokeWeight = (newStrokeWeight === undefined ? featureStrokeWeight : newStrokeWeight);
            featureCursor = (newCursor === undefined ? featureCursor : newCursor);
            featureIcon = (newIcon === undefined ? featureIcon : newIcon);
            featureShape = (newShape === undefined ? featureShape : newShape);
            featureTitle = (newTitle === undefined ? featureTitle : newTitle);
        }
        
        return {
            fillColor : featureFillColor,
            fillOpacity : featureFillOpacity,
            strokeColor : featureStrokeColor,
            strokeOpacity : featureStrokeOpacity,
            strokeWeight : featureStrokeWeight,
            cursor: featureCursor,
            icon : featureIcon,
            shape : featureShape,
            title : featureTitle
        }
        
    });
}