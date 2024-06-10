const formidable = require("formidable");
const { responseReturn } = require("../../utiles/response");
const cloudinary = require("cloudinary").v2;
const categoryModel = require("../../models/categoryModel");
const { convertSlug } = require("../../utiles/converSlug");

class categoryController {
  add_category = async (req, res) => {
    const form = formidable();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        responseReturn(res, 404, { error: "something went wrong" });
      } else {
        let { name } = fields;
        let { image } = files;
        name = name.trim();
        const slug = convertSlug(name);

        cloudinary.config({
          cloud_name: process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true,
        });

        try {
          const result = await cloudinary.uploader.upload(image.filepath, {
            folder: "categorys",
          });
          //   console.log("result", result);

          if (result) {
            const category = await categoryModel.create({
              name,
              slug,
              image: result.url,
            });
            responseReturn(res, 201, {
              category,
              message: "Category Added Successfully",
            });
          } else {
            responseReturn(res, 404, { error: "Image Upload File" });
          }
        } catch (error) {
          responseReturn(res, 500, { error: "Internal Server Error" });
        }
      }
    });
  };

  // end method

  get_category = async (req, res) => {
    const { page, searchValue, perPage } = req.query;
    // console.log("searchValue", searchValue);

    try {
      const regex = new RegExp(searchValue, "i");

      let skipPage = "";
      if (perPage && page) {
        skipPage = parseInt(perPage) * (parseInt(page) - 1);
      }

      if (searchValue && page && perPage) {
        const categorys = await categoryModel
          .find({
            slug: regex,
          })
          .skip(skipPage)
          .limit(perPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel
          .find({
            slug: regex,
          })
          .countDocuments();
        responseReturn(res, 200, { categorys, totalCategory });
      } else if (searchValue === "" && page && perPage) {
        const categorys = await categoryModel
          .find({})
          .skip(skipPage)
          .limit(perPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { categorys, totalCategory });
      } else {
        const categorys = await categoryModel.find({}).sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { categorys, totalCategory });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  get_category_detail = async (req, res) => {
    const { categoryId } = req.params;
    try {
      // console.log("categoryId", categoryId);
      const category = await categoryModel.findOne({
        _id: categoryId,
      });
      responseReturn(res, 200, { category });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  update_category = async (req, res) => {
    const { name, categoryId } = req.body;
    try {
      // console.log("name", name);
      await categoryModel.findByIdAndUpdate(categoryId, {
        name: name,
      });
      responseReturn(res, 200, {
        message: "The Category was updated successfully!",
      });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  update_category_image = async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, field, files) => {
      cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });
      const { image } = files;
      const { categoryId } = field;

      try {
        const result = await cloudinary.uploader.upload(image.filepath, {
          folder: "categorys",
        });

        if (result) {
          // console.log("result", result);
          await categoryModel.findByIdAndUpdate(categoryId, {
            image: result.url,
          });
          const category = await categoryModel.findById(categoryId);
          responseReturn(res, 201, {
            message: "Profile image was uploaded successfully!",
            category,
          });
        } else {
          responseReturn(res, 404, { error: "Image Upload Failed" });
        }
      } catch (error) {
        responseReturn(res, 404, { error: error.message });
      }
    });

    // end method
  };
}

module.exports = new categoryController();
