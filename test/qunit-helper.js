Log.setLogLevel(Log.info);
var TIMEOUT_MS = 10000;

function getFileRange(url, start, end, callback) {
	var xhr = new XMLHttpRequest();
	var range;
	xhr.open("GET", url, true);
	xhr.responseType = "arraybuffer";
	if (start !== 0 || end !== Infinity) {
		range = 'bytes=' + start + '-' + (end == Infinity ? '':end);
		xhr.setRequestHeader('Range', range);
	}
	Log.info("XHR", "Getting resource at "+url+(range ? " range: "+range : ""));
	xhr.onreadystatechange = function (e) { 
		var buffer;
		if ((xhr.status == 200 || xhr.status == 206 || xhr.status == 304 || xhr.status == 416) && xhr.readyState == this.DONE) {
			buffer = xhr.response;
			buffer.fileStart = start;
			if (!buffer.fileStart) {
				// IE does not support adding properties to an ArrayBuffer generated by XHR
				buffer = buffer.slice(0);
				buffer.fileStart = start;
			}
			callback(buffer);
		}
	};
	xhr.send();
}

function getFile(url, callback) {
	getFileRange(url, 0, Infinity, callback);
}

function checkBoxData(assert, box, data) {
	var i;
	assert.ok(box, "Found "+data.type+" box");
	for (var prop in data) {
		if ([ "sizePosition", "start", "fileStart"].indexOf(prop) > -1) {
			continue;
		} else if (Array.isArray(data[prop])) {
			for (i = 0; i < data[prop].length; i++) {
				var boxentry = box[prop][i];
				var dataentry = data[prop][i];
				assert.deepEqual(boxentry, dataentry, "Box property "+prop+", entry #"+i+" deep equality");
			}
		} else if (data[prop].byteLength) {
			var uint8data = new Uint8Array(data[prop]);
			var uint8box = new Uint8Array(box[prop]);
			var equal = true;
			if (uint8box.length !== uint8data.length) {
				equal = false;
			} else {
				for (i = 0; i < uint8box.length; i++) {
					if (uint8data[i] !== uint8box[i]) {
						equal = false;
						break;
					}
				}
			}
			assert.ok(equal, "TypedArray equality for "+prop);
		} else {
			assert.equal(box[prop], data[prop], "Box property "+prop+" is correct");
		}
	}
}
