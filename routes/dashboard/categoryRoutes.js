const categoryController = require("../../controllers/dasboard/categoryController");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const router = require("express").Router();

router.post("/category-add", authMiddleware, categoryController.add_category);
router.get("/category-get", authMiddleware, categoryController.get_category);
router.get(
  "/category-get-detail/:categoryId",
  authMiddleware,
  categoryController.get_category_detail
);

router.post(
  "/category-update",
  authMiddleware,
  categoryController.update_category
);

router.post(
  "/category-image-update",
  authMiddleware,
  categoryController.update_category_image
);

module.exports = router;
