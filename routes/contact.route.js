module.exports = (app) => {
  const router = require("express").Router();
  const contact = require("../controllers/contact.controller");

  router.route("/dataContact/:campaignId/:recipientsType").get(contact.dataContact);
  app.use("/contact", router);
};