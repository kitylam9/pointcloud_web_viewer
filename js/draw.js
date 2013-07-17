/**
 * Function to load one pointcloud into the canvas.
 */
function load(filename) {

	// Toggle the menu
	toggleMenu();
	
	// Show the slider
	var interval = self.setInterval(updateProgressBar,50);
	$('#szlider').show();

	// Init canvas
	geometry = new THREE.Geometry();
	geometry.dynamic = true;

	if (container.childNodes.length > 0)
		container.removeChild(container.childNodes[0]);

	// Get the point cloud
	$.ajax({
		url: 'services/get-pointcloud.php',
		data: {file:filename},
		type: 'GET',
		async: true,
		crossDomain: true,
		dataType: 'jsonp',
		success: function(res) {
			if (res == "error" || res == null || res == false) {
				// Ooops, failed to retrieve the pointcloud
				self.clearInterval(interval);
				$('#szlider').hide();
				$('#message').text("Impossible to load the pointcloud, make sure \
	    					you have loaded this file into the /data directory and \
	    					it is not too big (<10MB).");
	    		$('#notification').toggle('fast');
			}
			else {
				// Point cloud is here!
				var lines = res.split('\n');
				for (var i=0; i<lines.length; i++) {
					
					// Sanity check
					if (lines[i].length < 10) break;

					// Load the point
					var point = lines[i].split(',');
					var x = parseFloat(point[0]);
					var y = parseFloat(point[1]);
					var z = parseFloat(point[2]);
					var color = 'rgb(' + point[3] + ',' + point[4] + ',' + point[5] + ')';
					geometry.vertices.push(new THREE.Vector3(x, y, z));
					geometry.colors.push(new THREE.Color(colorToHex(color)));
				}

				// Setup controls
				controls = new THREE.TrackballControls(camera);
				controls.rotateSpeed = 1.0;
				controls.zoomSpeed = 10.2;
				controls.panSpeed = 0.8;
				controls.noZoom = false;
				controls.noPan = false;
				controls.staticMoving = true;
				controls.dynamicDampingFactor = 0.3;
				controls.keys = [65, 17, 18];
				controls.addEventListener('change', render);
				
				// Setup the scene
				material = new THREE.ParticleBasicMaterial({ size: particleSize, vertexColors: true });
				particles = new THREE.ParticleSystem(geometry, material);
				scene = new THREE.Scene();
				scene.fog = new THREE.FogExp2(0x000000, 0.0009);
				scene.add(particles);

				// Render the scene
				renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
				container.appendChild(renderer.domElement);
				renderer.render(scene, camera);
				animate();

				// Hide progress bar
				self.clearInterval(interval);
				$('#szlider').hide();
				pointcloudLoaded = true;
			}
		},
		error: function() {
			// Ooops, failed to retrieve the pointcloud
			self.clearInterval(interval);
			$('#szlider').hide();
			$('#message').text("Impossible to load the pointcloud, make sure \
				    		you have loaded this file into the /data directory and \
				    		it is not too big (<10MB).");
			$('#notification').toggle('fast');
		}
	});

	return false;
}

/**
 * Function to animate the render.
 */
function animate() {
	requestAnimationFrame(animate);
	controls.update();
}

/**
 * Event when mouse is moved.
 */
function onDocumentMouseMove(evt) {
	mouseX = (event.clientX - window.innerWidth / 2) * 10;
	mouseY = (event.clientY - window.innerHeight / 2) * 10;
	render();
}

/**
 * Event when mouse wheel is touched to implement zoom in/out.
 */
function onDocumentMouseWheel(evt) {
	var d = ((typeof evt.wheelDelta != "undefined")?(-evt.wheelDelta):evt.detail);
	d = 100 * ((d>0)?1:-1);    
	var cPos = camera.position;
	if (isNaN(cPos.x) || isNaN(cPos.y) || isNaN(cPos.y)) return;

	// Your zomm limitation 
	// For X axe you can add anothers limits for Y / Z axes
	if (cPos.z > 50  || cPos.z < -50 ) return;

	mb = d>0 ? 1.1 : 0.9;
	cPos.x  = cPos.x * mb;
	cPos.y  = cPos.y * mb;
	cPos.z  = cPos.z * mb;
}

/**
 * Event when key is pressed to increse/decrese the size of the particles
 */
function onDocumentKeyDown(evt) {

	if (pointcloudLoaded)
	{
		// Increase/decrease point size
		if (evt.keyCode == 189 || evt.keyCode == 109)
			particleSize -= 0.003;	// minus
		if (evt.keyCode == 187 || evt.keyCode == 107)
			particleSize += 0.003; 	// plus

		// Re-render the scene
		material = new THREE.ParticleBasicMaterial({ size: particleSize, vertexColors: true });
		particles = new THREE.ParticleSystem(geometry, material);
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x000000, 0.0009);
		scene.add(particles);
		renderer.render(scene, camera);
	}
}

/**
 * Render the scene.
 */
function render() {
	renderer.render(scene, camera);
}

/**
 * This function compute the hexadecimal value of a color in rgb format
 * like rgb(15,68,158);
 */
function colorToHex(color) {
    if (color.substr(0, 1) === '0x') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+),(\d+),(\d+)\)/.exec(color);
    
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    
    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + '0x' + rgb.toString(16);
}
