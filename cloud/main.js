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

Parse.Cloud.beforeSave("_User", function(request, response) {
  var user = request.object;
  if (!user.get("userImage")) {
    response.error("Users must have a profile photo.");
    return;
  }

  if (!user.dirty("userImage")) {
    // The profile photo isn't being modified.
    response.success();
    return;
  }

  Parse.Cloud.httpRequest({
    url: user.get("userImage").url()
  }).then(function(response) {
    var image = new Image();
    return image.setData(response.buffer);

  }).then(function(image) {
    // Crop the image to the smaller of width or height.
    var size = Math.min(image.width(), image.height());
    return image.crop({
      left: (image.width() - size) / 2,
      top: (image.height() - size) / 2,
      width: size,
      height: size
    });

  }).then(function(image) {
    // Resize the image to 64x64.
    return image.scale({
      width: 64,
      height: 64
    });

  }).then(function(image) {
    // Make sure it's a JPEG to save disk space and bandwidth.
    return image.setFormat("JPEG");

  }).then(function(image) {
    // Get the image data in a Buffer.
    return image.data();

  }).then(function(buffer) {
    // Save the image into a new file.
    var base64 = buffer.toString("base64");
    var cropped = new Parse.File("thumbnail.jpg", { base64: base64 });
    return cropped.save();

  }).then(function(cropped) {
    // Attach the image file to the original object.
    user.set("userThumbnail", cropped);
  }).then(function(result) {
    response.success();
  }, function(error) {
    response.error(error);
  });
});
