const formidable = require("formidable");
const { responseReturn } = require("../../utiles/response");
const cloudinary = require("cloudinary").v2;
const productModel = require("../../models/productModel");
const { convertSlug } = require("../../utiles/converSlug");

class productController {
  add_product = async (req, res) => {
    const { id } = req;
    const form = formidable({ multiples: true });

    form.parse(req, async (err, field, files) => {
      let {
        name,
        category,
        description,
        stock,
        price,
        discount,
        shopName,
        brand,
      } = field;
      const { images } = files;
      name = name.trim();
      const slug = convertSlug(name);

      cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });

      try {
        let allImageUrl = [];
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.uploader.upload(images[i].filepath, {
            folder: "products",
          });
          console.log("result", result);

          allImageUrl = [...allImageUrl, result.url];
        }

        await productModel.create({
          sellerId: id,
          name,
          slug,
          shopName,
          category: category.trim(),
          description: description.trim(),
          stock: parseInt(stock),
          price: parseInt(price),
          discount: parseInt(discount),
          images: allImageUrl,
          brand: brand.trim(),
        });
        responseReturn(res, 201, { message: "Product Added Successfully" });
      } catch (error) {
        responseReturn(res, 500, { error: error.message });
      }
    });
  };

  /// end method

  products_get = async (req, res) => {
    const { page, searchValue, parPage } = req.query;
    const { id } = req;

    const skipPage = parseInt(parPage) * (parseInt(page) - 1);

    const regex = new RegExp(searchValue, "i");

    try {
      if (searchValue) {
        const products = await productModel
          .find({
            slug: regex,
            sellerId: id,
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalProduct = await productModel
          .find({
            slug: regex,
            sellerId: id,
          })
          .countDocuments();
        responseReturn(res, 200, { products, totalProduct });
      } else {
        const products = await productModel
          .find({ sellerId: id })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalProduct = await productModel
          .find({ sellerId: id })
          .countDocuments();
        responseReturn(res, 200, { products, totalProduct });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // End Method

  discount_products_get = async (req, res) => {
    const { page, searchValue, parPage } = req.query;
    const { id } = req;

    const skipPage = parseInt(parPage) * (parseInt(page) - 1);

    const regex = new RegExp(searchValue, "i");

    try {
      if (searchValue) {
        const discountProducts = await productModel
          .find({
            slug: regex,
            sellerId: id,
            discount: { $gt: 0 },
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ discount: -1 });
        const totalDiscountProduct = await productModel
          .find({
            slug: regex,
            sellerId: id,
            discount: { $gt: 0 },
          })
          .countDocuments();
        responseReturn(res, 200, { discountProducts, totalDiscountProduct });
      } else {
        const discountProducts = await productModel
          .find({ sellerId: id, discount: { $gt: 0 } })
          .skip(skipPage)
          .limit(parPage)
          .sort({ discount: -1 });
        const totalDiscountProduct = await productModel
          .find({ sellerId: id, discount: { $gt: 0 } })
          .countDocuments();
        responseReturn(res, 200, { discountProducts, totalDiscountProduct });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  // End Method

  product_get = async (req, res) => {
    const { productId } = req.params;
    try {
      const product = await productModel.findById(productId);
      responseReturn(res, 200, { product });
    } catch (error) {
      console.log(error.message);
    }
  };
  // End Method

  product_update = async (req, res) => {
    let { name, description, stock, price, discount, brand, productId } =
      req.body;
    name = name.trim();
    const slug = name.split(" ").join("-");

    try {
      await productModel.findByIdAndUpdate(productId, {
        name,
        description,
        stock,
        price,
        discount,
        brand,
        productId,
        slug,
      });
      const product = await productModel.findById(productId);
      responseReturn(res, 200, {
        product,
        message: "Product Updated Successfully",
      });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  // End Method

  product_image_update = async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, field, files) => {
      const { oldImage, productId } = field;
      const { newImage } = files;

      if (err) {
        responseReturn(res, 400, { error: err.message });
      } else {
        try {
          let updatedImage;

          if (newImage) {
            cloudinary.config({
              cloud_name: process.env.cloud_name,
              api_key: process.env.api_key,
              api_secret: process.env.api_secret,
              secure: true,
            });

            const result = await cloudinary.uploader.upload(newImage.filepath, {
              folder: "products",
            });

            if (result) {
              updatedImage = result.url;
            } else {
              return responseReturn(res, 404, { error: "Image Upload Failed" });
            }
          }

          const product = await productModel.findById(productId);
          let { images } = product;

          if (oldImage) {
            const index = images.findIndex((img) => img === oldImage);
            if (index >= 0) {
              if (updatedImage) {
                images[index] = updatedImage; // Update the image
              } else {
                images.splice(index, 1); // Remove the old image if no new image
              }
            }
          } else {
            images.push(updatedImage); // Add new image if there's no old image
          }

          await productModel.findByIdAndUpdate(productId, { images });

          responseReturn(res, 200, {
            product,
            error: "Product image was updated successfully",
          });
        } catch (error) {
          responseReturn(res, 404, { error: error.message });
        }
      }
    });
  };

  delete_product = async (req, res) => {
    const { productId } = req.params;
    // console.log("delete_product", productId);
    try {
      await productModel.findByIdAndDelete(productId);
      const product = await productModel.findById(productId);
      responseReturn(res, 200, {
        message: "Delete The Product Successfully!",
      });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };
  // End Method
}

module.exports = new productController();
