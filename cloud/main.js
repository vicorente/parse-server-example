var moment = require('cloud/moment.js');
var Image = require("parse-image");

// Escala la imagen a la pantalla del dispositivo
Parse.Cloud.beforeSave("Event", function(request, response) {
  var event = request.object;
  if (!event.get("image")) {
    response.error("Events must have a profile photo.");
    return;
  }

  if (!event.dirty("image")) {
    // The event photo isn't being modified.
    response.success();
    return;
  }

  Parse.Cloud.httpRequest({
    url: event.get("image").url()

  }).then(function(response) {
    var image = new Image();
    return image.setData(response.buffer);
  }).then(function(image) {
    // Crop the image to the smaller of width or height.
    var minSize = Math.min(image.width(), image.height());
    if(minSize === image.width())
    {
      return image.scale({
        width: 340,
        height: 340*image.height()/image.width()
      });
    }
    else
    {
      return image.scale({
        width: 560*image.width()/image.height(),
        height: 560
      });
    }
  }).then(function(image) {
    // Make sure it's a JPEG to save disk space and bandwidth.
    return image.setFormat("JPEG");

  }).then(function(image) {
    // Get the image data in a Buffer.
    return image.data();

  }).then(function(buffer) {
    // Save the image into a new file.
    var base64 = buffer.toString("base64");
    var cropped = new Parse.File("scaledImage.jpg", { base64: base64 });
    return cropped.save();

  }).then(function(scaled) {
    // Attach the image file to the original object.
    event.set("image", scaled);

  }).then(function(result) {
    response.success();
  }, function(error) {
    response.error(error);
  });
});
