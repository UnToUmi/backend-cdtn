const customerAuthController = require("../../controllers/home/customerAuthController");
const router = require("express").Router();

router.post(
  "/customer/customer-register",
  customerAuthController.customer_register
);
router.post("/customer/customer-login", customerAuthController.customer_login);

router.get("/customer/logout", customerAuthController.customer_logout);

router.post(
  "/customer/customer-change-password",
  customerAuthController.customer_change_password
);

module.exports = router;
