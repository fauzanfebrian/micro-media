const express = require("express");
const router = express.Router();
const isBase64 = require("is-base64");
const base64Img = require("base64-img");
const { MediaModel } = require("../models");
const fs = require("fs");

router.get("/", async (req, res) => {
  console.log(req.ip);
  console.log(req.ips);
  const media = await MediaModel.findAll();
  const mappedMedia = media.map((m) => {
    m.image = `${req.get("host")}/${m.image}`;
    return m;
  });
  return res.json({ status: "success", data: mappedMedia });
});

router.post("/", (req, res) => {
  const { image } = req.body;
  if (!isBase64(image, { mimeRequired: true }))
    return res.status(400).json({ status: "error", message: "invalid base64" });
  base64Img.img(image, "./public/images", Date.now(), async (err, filePath) => {
    if (err)
      return res.status(400).json({ status: "error", message: err.message });
    const fileName = filePath.split("\\").pop();
    const media = await MediaModel.create({ image: `images/${fileName}` });
    return res.json({
      status: "success",
      data: {
        id: media.id,
        image: `${req.get("host")}/images/${fileName}`,
      },
    });
  });
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const media = await MediaModel.findByPk(id);

  if (!media)
    return res
      .status(404)
      .json({ status: "error", message: "media not found" });

  fs.unlink(`./public/${media.image}`, async (err) => {
    if (err)
      return res.status(400).json({ status: "error", message: err.message });
    media.destroy();
    return res.json({ status: "success", message: "media deleted" });
  });
});

module.exports = router;
