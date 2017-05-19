/*
* No Color Repeat Images
*
* A simple js script to make no color repeat images from
* a given img url. As described in: https://awoo.space/users/typhlosion/updates/55408
* Made by Dyedgreen ✌️
*/



/**
* Searches nearest colors for a color
* that matches an (arbitrary) condition.
* This uses a very naive search approach
* and can be very slow.
* The cache assumes, that each color can only be further away than the last.
* NOTE:
* l = limit; f = force; d = decision; o = offset;
*
* @param {object} color (Format: {r,g,b})
* @param {function} test (takes the new color as {r,g,b} has to retunr true/false)
* @param {bool} cache
* @return {objectORbool} (Returns {r,g,b}. Returns false, if no color is found.)
*/
searchColorCacheC = [];
searchColorCacheR = [];
searchColorCacheG = [];
searchColorCacheB = [];
function searchColor(color, test, cache) {
  // Set up the search
  var lR = 255 - color.r, fR = 0, dR = 0, oR = 0, r = 0;
  var lG = 255 - color.g, fG = 0, dG = 0, oG = 0, g = 0;
  var lB = 255 - color.b, fB = 0, dB = 0, oB = 0, b = 0;
  var newColor = {r:0,g:0,b:0};
  // Perform cache lookup
  var cacheI = -1, cacheV = 0, cR = 1, cG = 1, cB = 1;
  if (cache) {
    cacheV = color.r + 1000 * color.g + 1000000 * color.b;
    for (var i = 0, l = searchColorCacheC.length; i < l; i ++) {
      if (cacheV === searchColorCacheC[i]) {
        cacheI = i;
        cR = searchColorCacheR[i];
        cG = searchColorCacheG[i];
        cB = searchColorCacheB[i];
        break;
      }
    }
  }
  // Search RGB color space
  for (r = cR; r < 257; r ++) {
    for (g = cG; g < 257; g ++) {
      for (b = cB; b < 257; b ++) {
        // Generate the offsets
        // R
        if (dR === 1) {
          fR = r + oR;
        } else if (dR === 2) {
          fR = oR - r;
        } else if (r % 2 === 0) {
          fR = r/2;
          if (fR > lR) {
            fR = -fR;
            dR = 2; // Overflow top (offset is already set neg!)
            oR = r/2;
          }
        } else {
          fR = (r-1)/2;
          if (fR > color.r) {
            fR ++;
            dR = 1; // Overflow bottom
            oR = (1-r) / 2;
          } else {
            fR = -fR;
          }
        }
        // G
        if (dG === 1) {
          fG = g + oG;
        } else if (dG === 2) {
          fG = oG - g;
        } else if (g % 2 === 0) {
          fG = g/2;
          if (fG > lG) {
            fG = -fG;
            dG = 2;
            oG = g/2;
          }
        } else {
          fG = (g-1)/2;
          if (fG > color.g) {
            fG ++;
            dG = 1;
            oG = (1-g) / 2;
          } else {
            fG = -fG;
          }
        }
        // B
        if (dB === 1) {
          fB = b + oB;
        } else if (dB === 2) {
          fB = oB - b;
        } else if (b % 2 === 0) {
          fB = b/2;
          if (fB > lB) {
            fB = -fB;
            dB = 2;
            oB = b/2;
          }
        } else {
          fB = (b-1)/2;
          if (fB > color.b) {
            fB ++;
            dB = 1;
            oB = (1-b) / 2;
          } else {
            fB = -fB;
          }
        }
        // Create the new color
        newColor = { r: color.r+fR, g:color.g+fG, b: color.b+fB };
        // Test the new color
        if (test(newColor)) {
          // Write to cache if needed
          if (cache && r > 0) {
            if (cacheI === -1) {
              searchColorCacheC.push(cacheV);
              searchColorCacheR.push(r);
              searchColorCacheG.push(g);
              searchColorCacheB.push(b);
            } else {
              searchColorCacheC[cacheI] = cacheV;
              searchColorCacheR[cacheI] = r;
              searchColorCacheG[cacheI] = g;
              searchColorCacheB[cacheI] = b;
            }
          }
          // Return result
          return newColor;
        }
      }
      // Correct cache value for B
      cB = 1;
    }
    // Correct cache value for G
    cG = 1;
  }
  // No color was found, return false
  return false;
}

/**
* Create the canvas obj from
* url.
*
* @param {string} url
* @param {function} callback (is passed the finished canvas object OR false, on load error)
*/
function load(url, callback) {
  // Load the image
  var height = 0;
  var width = 0;
  var max = 300; // NOTE: Don't go big!!!
  var img = document.createElement('img');
  img.onload = function() {
    // Work out the size (to downscale the image)
    if (img.width > img.height) {
      if (img.width > max) {
        width = max;
        height = (max / img.width) * img.height;
      } else {
        width = img.width;
        height = img.height;
      }
    } else {
      if (img.height > max) {
        width = (max / img.height) * img.width;
        height = max;
      } else {
        width = img.width;
        height = img.height;
      }
    }
    // Create the canvas and draw the image onto it
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    // Return the canvas
    if (typeof callback === 'function') callback(canvas);
  };
  img.onerror = function() {
    // Load error
    if (typeof callback === 'function') callback(false);
  };
  img.crossOrigin = "Anonymous"; // To allow cross-origin
  img.src = url;
}

/**
* Takes a canvas and changes
* the colors such that no color
* appears more than once.
*
* @param {htmlCanvas} cancas
* @param {function} feedback (can be used to update ui)
* @param {function} callback (is handed the color)
*/
function filterCanvas(canvas, feedback, callback) {
  // Needed variables
  var used = [];
  var lastFeedback = -1;
  var startTime = Date.now();
  var imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  var pix = imgData.data;

  // Loop and change all pixels (using requrest animation frame)
  var i = 0;
  var loop = function () {
    // Find the current color and update it
    var color = { r: pix[i], g: pix[i+1], b: pix[i+2] };
    var newColor = searchColor(color, function(c) {
      // Test is color exists (using for loop)
      var l = used.length;
      var cs = c.r + 1000 * c.g + 1000000 * c.b;
      for (var i = 0; i < l; i ++) {
        if (used[i] === cs) return false;
      }
      return true;
    }, true);
    // Assign the new color
    if (newColor !== false) {
      // By giving each value a different magnitude, we don't need to convert to string
      used.push(newColor.r + 1000 * newColor.g + 1000000 * newColor.b);
      pix[i] = newColor.r;
      pix[i+1] = newColor.g;
      pix[i+2] = newColor.b;
    } else {
      // This should never be meet if the seach function works
      console.log('Malformed search function.');
      i = pix.length;
    }
    // Next loop step
    i += 4;
    if (i < pix.length) {
      // Progress feedback and next loop iteration
      if (Math.floor(1000 * i / pix.length) > lastFeedback) {
        // Create feedback
        lastFeedback = Math.floor(1000 * i / pix.length);
        window.requestAnimationFrame(function() {
          feedback(lastFeedback);
        });
        // Make sure the feedback will render
        window.requestAnimationFrame(function() {
          loop();
        });
      } else if (document.hasFocus()) {
        // Go full speed
        loop();
      } else {
        // Keep a lower profile
        window.requestAnimationFrame(function() {
          loop();
        });
      }
    } else {
      // Update the canvas
      canvas.getContext('2d').putImageData(imgData, 0, 0);
      // Pass canvas to callback
      callback(canvas);
      // Note the finished time
      console.log('Computation time (MS):', Date.now() - startTime);
    }
  }

  // Start loop
  window.requestAnimationFrame(function() {
    loop();
  });
}



// App runtime
function run(url) {
  // Display loading
  document.getElementById('form').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  // Fetch the image
  load(url, function(canvas) {
    // Test if image loaded
    if (canvas !== false) {
      // Display the image
      document.getElementById('display').src = ''.concat(canvas.toDataURL('image/png'));
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('displayHolder').classList.remove('hidden');
      // Run the filter
      window.requestAnimationFrame(function() {
        filterCanvas(canvas, function(p) {
          document.getElementById('progress').innerHTML = '<span>'.concat(p/10).concat('%</span>')
        }, function(canvas) {
          // Display the result
          document.getElementById('display').src = ''.concat(canvas.toDataURL('image/png'));
          document.getElementById('progress').classList.add('hidden');
        });
      });
    } else {
      // Display the error
      document.getElementById('loading').innerHTML = 'The image did not load 😵';
    }
  });
};

// Set up the different inputs
document.getElementById('create').onclick = function() { run(document.getElementById('url').value); };
document.getElementById('createUnsplash').onclick = function() { run('https://source.unsplash.com/random/'); };
document.getElementById('createFile').onchange = function() {
  files = document.getElementById('createFile').files;
  if (files && files.length >= 1) {
    // Read the image data
    var reader = new FileReader();
    reader.onload = function() {
      run(''.concat(reader.result));
    };
    reader.onerror = function() {
      // This will display an error
      run('');
    };
    reader.readAsDataURL(files[0]);
  }
};
